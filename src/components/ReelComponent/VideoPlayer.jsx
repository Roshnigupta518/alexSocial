import * as React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,Text,
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
        }
      }
    }, [shouldPlay]);

// console.log({shouldPlay})

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={1}
        style={{ width: WIDTH, height: screenHeight, alignItems: "center" }}
        onPress={onMuteClick}>

        {/* RN Video player component */}
        {!error && url !== "" ? (
          <Video
            key={resumeKey}
            ref={videoRef}
            source={{ uri: `${url}` }}
            style={{ width: WIDTH, height: screenHeight }}
            resizeMode='contain'
            repeat
            muted={shouldMute}
            // shouldPlay={!shouldPlay}
            paused={!shouldPlay}
            ignoreSilentSwitch="ignore"
            playInBackground={false}
            playWhenInactive={false}
            poster={thumbnail}
            posterResizeMode="contain"
            onLoadStart={() => {
              setIsBuffering(true);
              setError(false);
            }}
            onLoad={() => {
              setIsBuffering(false);
              handleVideoReady();
            }}
            onBuffer={({ isBuffering }) => setIsBuffering(isBuffering)}
            onError={(e) => {
              console.log("Video error:", e);
              setError(true);
              setIsBuffering(false);
            }}
          />
        ):
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

        {isBuffering && (
          <View style={[styles.loaderOverlay, { width: WIDTH, height: screenHeight }]}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}

      </TouchableOpacity>
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

  {/* expo player component */}
        {/* {!error && url !== "" && (
          <Video
            ref={videoRef}
            // key={url} // force reload on URL change
            style={{ width: WIDTH, height: screenHeight }}
            source={{ uri: url }}
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            shouldPlay={shouldPlay}
            isMuted={shouldMute}
            useNativeControls={false}
            onLoadStart={() => setIsBuffering(true)}
            onReadyForDisplay={() => {
              setTimeout(() => {
              handleVideoReady()
              setIsBuffering(false);
              setError(false);
              console.log('ready to display, hide loader');
              console.log('ready to display', isBuffering)
            }, 120);
            }}
            onError={(e) => {
              console.log("Video error:", e, url);
              setError(true);
              setIsBuffering(false);
            }}
            onPlaybackStatusUpdate={(status) => {
              if (status?.isLoaded) {
                // setIsBuffering(status.isBuffering);
                // Agar video already ready h to loader ignore karo
                if (!isVideoReady) {
                  setIsBuffering(status.isBuffering);
                }
                // Ensure autoplay works
                if (shouldPlay && !status.isPlaying) {
                  videoRef.current?.playAsync().catch(() => { });
                }
              }
            }}
            progressiveRenderingEnabled={false}
            posterSource={thumbnail ? { uri: thumbnail } : null}
            usePoster={true}
            useTextureView={false}
          />
        )} */}