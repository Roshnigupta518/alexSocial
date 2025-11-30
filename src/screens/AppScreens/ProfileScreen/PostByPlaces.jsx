import React, { useEffect, useState } from 'react';
import {
    FlatList, ActivityIndicator
} from 'react-native';
import { colors, } from '../../../constants';
import BackHeader from '../../../components/BackHeader';
import {  GetUserPostsRequest, GetUserPostsRequestForLocation } from '../../../services/Utills';
import MediaItem from '../../../components/GridView';
import NotFoundAnime from '../../../components/NotFoundAnime';
import CustomContainer from '../../../components/container';

const PostByPlaces = ({ navigation, route }) => {
    const [skip, setSkip] = useState(0);
    const [limit] = useState(5);

    const { id, type, userId } = route?.params

    const [loading, setLoading] = useState(false);
    const [dataSource, setDataSource] = useState([]);
    const [isListEnd, setIsListEnd] = useState(false);

    const getData = () => {
        console.log(skip);
      
        if (!loading && !isListEnd) {
          console.log('getData');
      
          setLoading(true);

               let url;
        if (type === 'Cities') {
            url = `${userId}?city=${id}&skip=${skip}&limit=${limit}`;
        } else {
            url = `${userId}?country=${id}&skip=${skip}&limit=${limit}`;
        }
      
          GetUserPostsRequestForLocation(url)
            .then(responseJson => {
              console.log({responseJson: responseJson.result});
      
              if (responseJson?.result?.length > 0) {
                // Increase offset
                setSkip(skip + 5);
      
                // Append new posts
                setDataSource([...dataSource, ...responseJson.result]);
      
                setLoading(false);
              } else {
                setIsListEnd(true);
                setLoading(false);
              }
            })
            .catch(error => {
              console.error(error);
              setLoading(false);
            });
        }
      };

    useEffect(() => getData(), [id, type, userId, skip]);

    return (
            <CustomContainer>
                <BackHeader label={`Posts of ${id}`}/>
                    <FlatList
                        data={dataSource}
                        renderItem={({ item, index }) => (
                            <MediaItem
                                item={item}
                                onPress={() =>
                                    navigation.navigate('ReelViewer', {
                                        data: dataSource,
                                        currentIndex: index,
                                        onDeletePost: deletedId => {
                                            setDataSource(prev => prev.filter(item => item?.postData?._id !== deletedId));
                                            // inform ProfileDetail
                                        if (route.params?.onPostDelete) {
                                            route.params.onPostDelete(deletedId);
                                        }
                                          },
                                    })
                                }
                                index={index}
                            />
                        )}
                        numColumns={3}
                        keyExtractor={(item) => item.postData._id?.toString()}
                        contentContainerStyle={{ padding: 15 }}
                        ListEmptyComponent={<NotFoundAnime isLoading={loading} />}
                        onEndReached={getData}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={
                            dataSource.length > 0 && !isListEnd ? (
                                <ActivityIndicator size="small" color={colors.primaryColor} />
                            ) : null
                        }
                    />
            </CustomContainer>
     
    );
};

export default PostByPlaces;