import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    Image,
    TouchableOpacity,
    Platform,
    StyleSheet,
    FlatList, Dimensions, ActivityIndicator
} from 'react-native';
import { colors, fonts, HEIGHT, WIDTH, wp } from '../../../constants';
import BackHeader from '../../../components/BackHeader';
import ImageConstants from '../../../constants/ImageConstants';
import { useSelector } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import { GetUserPostsRequest } from '../../../services/Utills';
import Toast from '../../../constants/Toast';
import MediaItem from '../../../components/GridView';
import NotFoundAnime from '../../../components/NotFoundAnime';
import st from '../../../global/styles';
import CustomContainer from '../../../components/container';

const PostByPlaces = ({ navigation, route }) => {
    const userInfo = useSelector(state => state.UserInfoSlice.data);
    const [postData, setPostData] = useState([]);
    const [isLoading, setIsLoading] = useState(false)

    const [skip, setSkip] = useState(0);
    const [limit] = useState(5);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);


    const { id, type, userId } = route?.params

    const getUsersPosts = async (isLoadMore = false) => {
        if (isLoadMore && isFetchingMore) return;
    
        if (!isLoadMore) setIsLoading(true);
        else setIsFetchingMore(true);
    
        let url;
        if (type === 'Cities') {
            url = `${userId}?city=${id}&skip=${skip}&limit=${limit}`;
        } else {
            url = `${userId}?country=${id}&skip=${skip}&limit=${limit}`;
        }
    
        try {
            const res = await GetUserPostsRequest(url);
            const newData = res?.result || [];
    
            if (newData.length > 0) {
                setPostData(prev => (isLoadMore ? [...prev, ...newData] : newData));
                setSkip(prev => prev + limit);
            } else {
                setHasMore(false);
            }
        } catch (err) {
            console.log('err', err);
            Toast.error('Post', err?.message);
        } finally {
            if (!isLoadMore) setIsLoading(false);
            else setIsFetchingMore(false);
        }
    };

    useEffect(() => {
        setSkip(0);
        setHasMore(true);
        setPostData([]);
        getUsersPosts();
    }, [id, type, userId]);
    

    return (
        <>
            <CustomContainer>
                <BackHeader
                label={`Posts of ${id}`}
                />
                {/* <View style={[st.card,{paddingHorizontal:20}]}>
                    <View
                        style={st.cardContent}>
                        <View style={st.cardBar} />
                        <View
                            style={st.internalCard}>

                            <Text
                                numberOfLines={2}
                                style={st.cardTitle}>
                                {id}
                            </Text>
                        </View>
                    </View>
                </View> */}
                <View
                    style={{
                        flex: 1,
                    }}>
                    <FlatList
                        data={postData}
                        renderItem={({ item, index }) => (
                            <MediaItem
                                item={item}
                                onPress={() =>
                                    navigation.navigate('ReelViewer', {
                                        data: postData,
                                        currentIndex: index,
                                    })
                                }
                                index={index}
                            />
                        )}
                        numColumns={3}
                        keyExtractor={(item, index) => index.toString()}
                        contentContainerStyle={{ padding: 15 }}
                        ListEmptyComponent={<NotFoundAnime isLoading={isLoading} />}
                        onEndReached={() => {
                            if (hasMore && !isFetchingMore) getUsersPosts(true);
                        }}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={
                            isFetchingMore ? (
                                <ActivityIndicator size="small" color={colors.primaryColor} />
                            ) : !hasMore && postData.length > 0 ? (
                               null
                            ) : null
                        }
                    />


                </View>
            </CustomContainer>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
});

export default PostByPlaces;
