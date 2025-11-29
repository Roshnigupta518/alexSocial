import React, { useEffect, useState } from 'react';
import {
    View,
    StyleSheet,
    FlatList, ActivityIndicator
} from 'react-native';
import { colors, } from '../../../constants';
import BackHeader from '../../../components/BackHeader';
import { useSelector } from 'react-redux';
import {  GetUserPostsRequestForLocation } from '../../../services/Utills';
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
            const res = await GetUserPostsRequestForLocation(url);
            const newData = res?.result || [];
    
            if (newData.length > 0) {
                setPostData(prev => {
                    const merged = isLoadMore ? [...prev, ...newData] : newData;
                    const unique = Array.from(new Map(merged.map(i => [i.postData._id, i])).values());
                    return unique;
                });
                
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
     
            <CustomContainer>
                <BackHeader
                label={`Posts of ${id}`}
                />
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
                        keyExtractor={(item) => item.postData._id?.toString()}
                        contentContainerStyle={{ padding: 15 }}
                        ListEmptyComponent={<NotFoundAnime isLoading={isLoading} />}
                        onEndReached={() => {
                            if (hasMore && !isFetchingMore) getUsersPosts(true);
                        }}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={
                            postData.length > 0 && isFetchingMore ? (
                                <ActivityIndicator size="small" color={colors.primaryColor} />
                            ) : null
                        }
                        
                    />
            </CustomContainer>
     
    );
};



export default PostByPlaces;
