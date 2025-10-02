import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    Image,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet, DeviceEventEmitter
} from "react-native";
import { GetAllStoryRequest } from "../../../services/Utills";
import { colors, wp } from "../../../constants";
import BackHeader from "../../../components/BackHeader";
import st from "../../../global/styles";
import ImageConstants from "../../../constants/ImageConstants";
import { useSelector } from "react-redux";
import Toast from "../../../constants/Toast";
import {DeleteStoryRequest} from "../../../../src/services/Utills";
import InstaThumbnailSlider from "../../../components/InstaThumbnailSlider";
import NotFoundAnime from "../../../components/NotFoundAnime";
import CustomContainer from "../../../components/container";

const StoryViewerScreen = ({ navigation, route }) => {
    const { storyId,  } = route.params || {};
    const [stories, setStories] = useState([]);
    const [skip, setSkip] = useState(0);
    const limit = 5;
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // console.log({stories})

    const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

    const userInfo = useSelector(state => state.UserInfoSlice.data);

    const DeleteStoryById = (storyId) => {
        if (!storyId) return;

        DeleteStoryRequest(storyId)
            .then(res => {
                Toast.success('Story', res?.message);

                setStories(prev => {
                    const updated = prev.filter(story => story.id !== storyId);

                     // 🔔 notify HomeScreen (no function in params)
                        // DeviceEventEmitter.emit('storyDeleted', {
                        //     storyId,
                        //     userId: userInfo?.id,
                        //     addedFrom: selectedStory.added_from, // pass personal/business info
                        // });

                         // 🔔 notify HomeScreen with correct id (business_id OR user_id)
                         console.log('story business id',selectedStory.business_id )
        DeviceEventEmitter.emit('storyDeleted', {
            storyId,
            userId: selectedStory.added_from === "2"
    ? selectedStory.business_id  // 👈 match STORY_UPLOADED card id
    : userInfo?.id,
            addedFrom: selectedStory.added_from,
          });

                    // 🔹 Agar koi story bachi hi nahi -> goBack()
                    if (updated.length === 0) {
                        navigation.goBack();
                    }else {
                        // 👇 move focus
                        if (selectedStoryIndex >= updated.length) {
                            // agar last delete hua, to previous pe jao
                            setSelectedStoryIndex(updated.length - 1);
                        } else {
                            // warna same index pe raho (jo ab agla story hoga)
                            setSelectedStoryIndex(selectedStoryIndex);
                        }
                    }

                    return updated;
                });
            })
            .catch(err => {
                console.log('err', err);
                Toast.error('Story', err?.message);
            });
    };

    const transformStories = (apiResponse) => {
        let storiesList = [];
        apiResponse.forEach(user => {
            user.stories.forEach(story => {
                storiesList.push({
                    ...story,
                    userId: user.user_id,
                    added_from : user.added_from,
                    business_id: user.business_id,
                    username: user.user_name,
                    profile: user.user_image,
                });
            });
        });
        return storiesList;
    };

    const fetchStories = async () => {
        if (loading || !hasMore) return;
        setLoading(true);
        try {
            let url = { skip, limit };
          const res = await GetAllStoryRequest();
          if (res?.status) {
            // 🔹 Filter only my stories
            const myStoriesOnly = res.result.filter(
              user => user.user_id === userInfo.id
            );
      
            // 🔹 Transform to flat list (API order maintain karega)
            const newStories = transformStories(myStoriesOnly);
      
            setStories(newStories);
      
            // ✅ storyId ke basis pe correct index select karo
            if (storyId && newStories.length > 0) {
              const foundIndex = newStories.findIndex(st => st.id === storyId);
              console.log({foundIndex})
              if (foundIndex !== -1) {
                setSelectedStoryIndex(foundIndex);
              } else {
                setSelectedStoryIndex(0); // agar nahi mila to first story
              }
            } else {
              setSelectedStoryIndex(0); // default first story
            }
      
            if (newStories.length < limit) {
              setHasMore(false);
            }
          }
        } catch (err) {
          console.log("Error fetching stories:", err);
        }
        setLoading(false);
    };
      
   
    useEffect(() => {
        fetchStories();
    }, [storyId]);

    const selectedStory = stories[selectedStoryIndex] || {};
    const likedUserIds = new Set(selectedStory.likes?.map(like => like.user_id._id) || []);

    return (
        <CustomContainer>
            <BackHeader />
            <View style={{  height:'30%' }}>
                <InstaThumbnailSlider
                    stories={stories}
                    selectedIndex={selectedStoryIndex}
                    setSelectedIndex={setSelectedStoryIndex}
                />
            </View>

            {!loading &&
            <View style={st.businessTimeCon}>
                {/* <Text style={[st.labelStyle, styles.heading]}>{selectedStory?.viewers?.length} Viewers</Text> */}
                 <Text style={[st.labelStyle, styles.heading]}>
                {[...new Set((selectedStory?.viewers || []).map(v => v.user_id._id))].length} Viewers
                </Text>
                <View style={st.alignE}>
                    <TouchableOpacity onPress={() => DeleteStoryById(selectedStory?.id)}>
                        <Image source={ImageConstants.delete_new} style={styles.trashicon}
                            tintColor={colors.black}
                        />
                    </TouchableOpacity>
                </View>
            </View> }

            <FlatList
                data={selectedStory.viewers || []}
                // keyExtractor={(item, idx) => item.user_id._id + idx}
                keyExtractor={(item, idx) => `${item.user_id._id}-${idx}`}
                renderItem={({ item }) => {
                    const hasLiked = likedUserIds.has(item.user_id._id);
                    const profileSource = item.user_id.profile_picture
                    ? { uri: item.user_id.profile_picture }
                    : ImageConstants.business_logo;
                    return (
                        <View style={styles.viewerRow}>
                            <Image
                                source={profileSource}
                                style={styles.avatar}
                            />
                            {hasLiked && (
                                <Image
                                    source={ImageConstants.filled_like}
                                    style={{
                                        position: 'absolute', left: '12%', bottom: 0,
                                        width: wp(18), resizeMode:'center', height: wp(18)
                                    }}
                                    resizeMode={'center'}
                                    tintColor={colors.primaryColor}
                                />
                            )}
                            <Text style={st.labelStyle}>{item.user_id.name}</Text>

                        </View>
                    )
                }}
                ListEmptyComponent={
                    loading ?
                    <ActivityIndicator color={colors.primaryColor}  />
                     :
                    <NotFoundAnime />
                }
            />
        </CustomContainer>
    );
}

export default StoryViewerScreen

const styles = StyleSheet.create({
    storyThumb: {
        width: 120,
        height: 150,
        borderRadius: 5,
    },
    activeThumb: {
        borderColor: colors.primaryColor,
    },
    gradientBorder: {
        padding: 3, 
        borderRadius: 10,
        marginHorizontal: 8,
    },
    heading: {
        marginTop: 20,
        marginLeft: 15,
    },
    viewerRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderBottomWidth: 0.5,
        borderColor: "#ddd",
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    name: {
        fontSize: 14,
    },
    trashicon: {
        height: wp(22),
        width: wp(22),
        alignSelf: 'center',
        marginVertical: wp(30),
        marginTop: 20,
        marginRight: 15
    }
});
