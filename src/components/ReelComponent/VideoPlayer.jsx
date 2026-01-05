import * as React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image, Text,
  ActivityIndicator, Animated
} from "react-native";
import { useSelector } from "react-redux";
import { WIDTH } from "../../constants";
import Video from "react-native-video";
import st from "../../global/styles";

export default function VideoPlayer({
  url = "",
  shouldPlay,
  screen = "",
  onMuteClick = () => { },
  screenHeight,
  thumbnail,
}) {
  const videoRef = React.useRef(null);
  const shouldMute = useSelector((state) => state.VideoMuteSlice.isMute);

  const [isBuffering, setIsBuffering] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [resumeKey, setResumeKey] = React.useState(0);
  const [showThumbnail, setShowThumbnail] = React.useState(true);

  const [isVideoReady, setIsVideoReady] = React.useState(false);
  const fadeAnim = React.useRef(new Animated.Value(1)).current; // thumbnail opacity

  const handleVideoReady = () => {
    setIsVideoReady(true);

    // Animate thumbnail fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current = null;
      }
    };
  }, []);

  // 🟢 Force resume/pause when shouldPlay changes
  React.useEffect(() => {
    if (videoRef.current) {
      if (shouldPlay) {
        console.log("▶️ Forcing play");
        // videoRef.current.seek(0); // optional: restart from beginning
      } else {
        console.log("⏸ Forcing pause");
        setShowThumbnail(true);
      }
    }
  }, [shouldPlay]);

  React.useEffect(() => {
    setShowThumbnail(true);
    setIsBuffering(true);
    setError(false);
  }, [url]);

  // console.log({shouldPlay})

  return (
    <View style={styles.container}>
      {/* RN Video player component */}
      {!error && url !== "" ? (
        <Video
          key={url + thumbnail}
          ref={videoRef}
          source={{ uri: `${url}` }}
          style={{ width: WIDTH, height: screenHeight }}
          resizeMode='contain'
          repeat
          muted={shouldMute}
          // muted={muted}
          paused={!shouldPlay}
          ignoreSilentSwitch="ignore"
          playInBackground={false}
          playWhenInactive={false}
          poster={thumbnail}
          onLoadStart={() => {
            setIsBuffering(true);
            setError(false);
          }}
          onLoad={() => {
            setIsBuffering(false);
            handleVideoReady();
            // Hide thumbnail only when video metadata is loaded and ready
            setShowThumbnail(false);
          }}
          onBuffer={({ isBuffering }) => setIsBuffering(isBuffering)}
          onError={(e) => {
            console.log("Video error:", e);
            setError(true);
            setIsBuffering(false);
            setShowThumbnail(true);
          }}
          pointerEvents="none"
        />
      ) :
        <View style={st.center}>
          <Text style={st.errorText}>Failed to load</Text>
          <TouchableOpacity
            onPress={() => {
              setError(false);
              setIsBuffering(true);
              setIsVideoReady(false);
            }}>
            <Text style={st.errorText}>Tap to Retry</Text>
          </TouchableOpacity>
        </View>
      }

      {/* Manual Thumbnail Overlay */}
      {/* {showThumbnail && thumbnail && (
        <Image
          source={{ uri: thumbnail }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: WIDTH,
            height: screenHeight,
            resizeMode: "contain",
          }}
        />
      )} */}

      {/* Overlay for tap */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={onMuteClick}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: WIDTH,
          height: screenHeight,
          zIndex: 2,
        }}
      />

      {isBuffering && (
        <View style={[styles.loaderOverlay, { width: WIDTH, height: screenHeight }]}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  loader: {
    position: "absolute",
    alignSelf: "center",
    top: "50%",
    marginTop: -20,
  },

  loaderOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent", // smooth overlay
  },

});

