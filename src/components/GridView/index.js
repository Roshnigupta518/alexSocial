import React,{useState} from 'react';
import { Image, TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import ImageConstants from '../../constants/ImageConstants';
import { wp, WIDTH, colors } from '../../constants';
import st from '../../global/styles';

const MediaItem = ({ item, size, onPress, index }) => {
    
    const [hasError, setHasError] = useState(false);
    const [hasVdoError, setHasVdoError] = useState(false);

    const imageUri = item?.postData?.post?.data;

    return (
        <TouchableOpacity onPress={onPress}>
            {item?.postData?.post?.mimetype != 'video/mp4' ? (
                hasError ? (
                    <View style={[styles.userPostImage, st.center]}>
                        <Text style={[st.activeChipText, st.txAlign]}>Image not available</Text>
                    </View>
                ) : (
                    <Image
                        source={{ uri: imageUri }}
                        style={styles.userPostImage}
                        onError={() => setHasError(true)}
                    />
                )
            ) : (
                <View style={styles.videoContainer}>
                    <View style={styles.playIconStyle}>
                        <Image
                            source={ImageConstants.play}
                            style={{
                                height: wp(25),
                                width: wp(25),
                                alignSelf: 'center',
                            }}
                        />
                    </View>
                    {hasVdoError ? (
                    <View style={[styles.userPostImage]}>
                        <Text style={[st.activeChipText, st.txAlign]}>{'\n'}Thumbnail not available</Text>
                    </View>
                ) : (
                    <Image
                        source={item?.postData?.post_thumbnail ? 
                            { uri: item?.postData?.post_thumbnail } : 
                            ImageConstants.business_logo}
                        style={ styles.userPostImage}
                        onError={() => setHasVdoError(true)}
                    />
                        )}
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    media: {
        width: '100%',
        height: '100%',
    },
    userPostImage: {
        height: 120,
        width: WIDTH / 3.5,
        margin: 4,
        borderColor:colors.gray,
        borderWidth:0.3,
        borderRadius:3
      },
      videoContainer: {
        // padding: 4,
        // borderWidth: 1,
        // borderColor: colors.primaryColor,
        // borderRadius: 10,
        // margin: 4,
      },
      playIconStyle: {
        position: 'absolute',
        top: 55,
        width: WIDTH / 3.1,
        zIndex: 2,
      }
});

export default MediaItem;
