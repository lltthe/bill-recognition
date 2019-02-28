import React, { Component } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  Image, TouchableOpacity
} from 'react-native';

import ActionButton from 'react-native-action-button';
import IconMaterial from 'react-native-vector-icons/MaterialIcons';
import SpinnerButton from 'react-native-spinner-button';
import CustomCrop from 'react-native-perspective-image-cropper';
import RNFetchBlob from 'rn-fetch-blob';
import ImagePicker from 'react-native-image-picker';

const styles = StyleSheet.create({
  actionButtonIcon: {
    fontSize: 24,
    height: 25,
    color: 'white',
  },
  container: {
    flex: 1,
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center'
  },
  spinnerButtonText: {
    fontSize: 18,
    textAlign: 'center',
    color: 'white',
    paddingHorizontal: 10,
  },
  spinnerButtonStyle: {
    borderRadius: 10,
    margin: 10,
  }
});

const imagePickerOptions = {
  title: null
}

export default class App extends Component {

  constructor() {
    super();
    this.state = {
      image: null,
      running: false
    };
    this.customCrop = null
  }

  handleImagePicking(response) {
    if (response.didCancel) {
      Alert.alert('Warning', 'The user has canceled picking image on purpose!')
    } else if (response.error) {
      Alert.alert('Error', 'Cannot get the image!')
    } else {
      this.setState({ image: { uri: response.uri, height: response.height, width: response.width } })
    }
  }

  pickImageFromCamera() {
    ImagePicker.launchCamera(imagePickerOptions, (response) => this.handleImagePicking(response))
  }

  pickImageFromFile() {
    ImagePicker.launchImageLibrary(imagePickerOptions, (response) => this.handleImagePicking(response))
  }

  updateImage(newImage) {
    this.setState({ image: newImage })
  }

  crop() {
    this.customCrop.crop()
  }

  render() {
    return (<View style={styles.container}>


      <Image style={{ width: 300, height: 300, resizeMode: 'contain' }} source={this.state.image} />

      {/*
      {this.state.image &&
        <CustomCrop
          updateImage={this.updateImage.bind(this)}
          initialImage={this.state.image.uri}
          height={this.state.image.height}
          width={this.state.image.width}
          ref={(ref) => this.customCrop = ref}
        />
      }

      {this.state.image &&
        <TouchableOpacity onPress={this.crop.bind(this)}>
          <Text>CROP IMAGE</Text>
        </TouchableOpacity>
      }
    */}

      <SpinnerButton
        spinnerType='BarIndicator'
        buttonStyle={styles.spinnerButtonStyle}
        isLoading={this.state.running}
        onPress={() => {

          if (!this.state.image) {
            Alert.alert('Warning', 'Please choose an image first!')
          } else {
            this.setState({ running: true })

            RNFetchBlob.config({
              trusty: true
            })
              .fetch('POST', 'https://capstoneproject.serveo.net/api/segment/', {
                'Content-Type': 'multipart/form-data'
              }, [
                  { name: 'image', filename: 'data.jpg', type: 'image/foo', data: RNFetchBlob.wrap(this.state.image.uri) }
                ])
              .then((resp) => {
                var tmp = JSON.parse(resp.data)

                var str = ''
                for ([key, value] of Object.entries(tmp.data)) {
                  str += key + ':\n\t\t' + value + '\n'
                }

                Alert.alert('Result', str)

                this.setState({ running: false })
              })
              .catch((err) => {
              })

          }
        }}>
        <Text style={styles.spinnerButtonText}>Perform Recognition</Text>
      </SpinnerButton>

      <ActionButton buttonColor='rgba(231,76,60,1)' offsetY={50} offsetX={25}>
        <ActionButton.Item buttonColor='#9b59b6' title='From camera' onPress={() => this.pickImageFromCamera()}>
          <IconMaterial name='camera-alt' style={styles.actionButtonIcon} />
        </ActionButton.Item>
        <ActionButton.Item buttonColor='#1abc9c' title='From file' onPress={() => this.pickImageFromFile()}>
          <IconMaterial name='image' style={styles.actionButtonIcon} />
        </ActionButton.Item>
      </ActionButton>

    </View>);
  }
}