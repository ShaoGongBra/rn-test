/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { ExpIcon } from './ExpIcon';
import { WifiIcon } from './WifiIcon';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: '#eee',
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView>
        {/* <View
          style={{
            backgroundColor: '#000',
            height: 300,
            paddingTop: 200,
            paddingLeft: 200
          }}>
          <View style={{
            position: 'absolute',
            // width height 100%会排除父元素的padding
            width: '100%', height: '100%', left: 0, top: 0,
            backgroundColor: '#666'
          }} />
        </View> */}
        <View>
          <Text>WifiIcon</Text>
          <WifiIcon name='namecard' size={24} color='#333' />
          <WifiIcon name='date' size={24} color='#333' />
          <WifiIcon name='help_FAQ' size={24} color='#333' />
        </View>
        <View>
          <Text>ExpIcon</Text>
          <ExpIcon name='dizhibu' size={24} color='#333' />
          <ExpIcon name='gift' size={24} color='#333' />
          <ExpIcon name='dizhibu' size={24} color='#333' />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default App;
