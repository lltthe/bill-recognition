import React, { Component } from 'react'
import {
  View, ImageBackground, TouchableOpacity, Alert
} from 'react-native'

import ActionButton from 'react-native-action-button'
import IconMaterial from 'react-native-vector-icons/MaterialIcons'
import ImagePicker from 'react-native-image-picker'
import TextDetector from "react-native-text-detector"

import styles, { screenHeight, screenWidth } from './styles'

const imagePickerOptions = {
  title: null
}

export default class App extends Component {

  constructor() {
    super()
    this.state = {
      image: null,
      resp: null
    }
  }

  handleImagePicking(response) {
    if (response.didCancel) {
      Alert.alert('Warning', 'The user has canceled picking image on purpose!')
    } else if (response.error) {
      Alert.alert('Error', 'Cannot get the image!')
    } else {
      var result = { uri: response.uri, height: response.height, width: response.width }
      this.setState({ image: result })
      this.detectText(result)
    }
  }

  pickImageFromCamera() {
    ImagePicker.launchCamera(imagePickerOptions, (response) => this.handleImagePicking(response))
  }

  pickImageFromFile() {
    ImagePicker.launchImageLibrary(imagePickerOptions, (response) => this.handleImagePicking(response))
  }

  detectText = async (image) => {
    const resp = await TextDetector.detectFromUri(image.uri)
    this.setState({ resp: this.mapResp(resp, image) })
  }

  mapResp = (resp, image) => {
    const image2ScreenY = screenHeight / image.height
    const image2ScreenX = screenWidth / image.width

    return resp.map(item => {
      return {
        ...item,
        position: {
          width: item.bounding.width * image2ScreenX,
          left: item.bounding.left * image2ScreenX,
          height: item.bounding.height * image2ScreenY,
          top: item.bounding.top * image2ScreenY
        }
      }
    })
  }

  render() {
    return (<View style={styles.screen}>

      {this.state.image && this.state.resp ? (
        <ImageBackground style={styles.imageBackground} source={this.state.image} resizeMode='cover' >
          {this.state.resp.map(item => {
            return (
              <TouchableOpacity style={[styles.boundingRect, item.position]} key={item.text} onPress={() => {Alert.alert('Result', item.text)}}
              />
            )
          })}
        </ImageBackground>
      ) : null}

      <ActionButton buttonColor='rgba(231, 76, 60, 1)' offsetY={25} offsetX={25}>

        <ActionButton.Item buttonColor='#9b59b6' title='From camera' onPress={() => this.pickImageFromCamera()}>
          <IconMaterial name='camera-alt' style={styles.actionButtonIcon} />
        </ActionButton.Item>

        <ActionButton.Item buttonColor='#1abc9c' title='From file' onPress={() => this.pickImageFromFile()}>
          <IconMaterial name='image' style={styles.actionButtonIcon} />
        </ActionButton.Item>

      </ActionButton>

    </View>)
  }
}