import React from 'react';
import { Alert, StatusBar } from 'react-native';
import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import { Button, Text, View } from 'react-native';

export default function UpdatesDemo() {
  const {
    currentlyRunning,
    isUpdateAvailable,
    isUpdatePending
  } = Updates.useUpdates();

  useEffect(() => {
    if (isUpdatePending) {
      // Update has successfully downloaded; apply it now
      Updates.reloadAsync();
    }
  }, [isUpdatePending]);

  // If true, we show the button to download and run the update
  const showDownloadButton = isUpdateAvailable;

  // Show whether or not we are running embedded code or an update
  const runTypeMessage = currentlyRunning.isEmbeddedLaunch
    ? 'This app is running from built-in code'
    : 'This app is running an update';

  return (
    <View style={{}}>
      <StatusBar
        barStyle={'dark-content'}
        backgroundColor="#eee"
      />
      <Text style={{}}>热更新示例</Text>
      <Text>{runTypeMessage}</Text>
      <Text>test888</Text>
      <Button onPress={() => {
        Updates.checkForUpdateAsync().then(res => {
          Alert.alert('then', JSON.stringify(res))
        }).catch(err => {
          console.log(err)
          Alert.alert('catch', err.message)
        })
      }} title="检查更新" />
      {showDownloadButton ? (
        <Button onPress={() => Updates.fetchUpdateAsync()} title="下载并更新" />
      ) : null}
    </View>
  );
}
