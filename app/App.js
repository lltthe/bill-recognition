import React, { Component } from 'react'
import {
  View, Alert, ImageEditor, ScrollView, ActivityIndicator, Text
} from 'react-native'

import IconMaterial from 'react-native-vector-icons/MaterialIcons'
import ActionButton from 'react-native-action-button'
import ImagePicker from 'react-native-image-picker'
import { CardViewWithImage } from 'react-native-simple-card-view'
import RNFetchBlob from 'rn-fetch-blob'
import DialogInput from 'react-native-dialog-input'
import AsyncStorage from '@react-native-community/async-storage'
import FlashMessage, { showMessage } from 'react-native-flash-message'
import styles, { cardWidth } from './styles'

const imagePickerOptions = {
  title: null
}

console.disableYellowBox = true

const SERVER_KEY = 'server'

const serverHeader = 'https://'

export default class App extends Component {

  constructor() {
    super()
    this.state = {
      originalImage: null,
      preprocessedImage: null,
      lineImages: null,
      rawLineImages: null,
      server: '',
      showServerAddressInput: false,
      preprocessing: false
    }
  }

  componentWillMount() {
    AsyncStorage.getItem(SERVER_KEY).then((val) => {
      this.setState({ server: val })
    })
  }

  componentDidMount() {
    showMessage({
      message: 'Usage Hint',
      description: 'Tap the action button at the bottom right of the screen to select an image for processing',
      type: 'info',
      duration: 4000
    })
  }

  render() {
    if (this.state.preprocessing) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator style={{ margin: 20 }}
            animating={true}
            size='large' />
          <Text>
            Preprocessing! Please wait...
          </Text>
        </View>
      )
    } else {
      return (
        <View style={styles.screen}>

          <ScrollView>
            {this.state.lineImages ? (this.state.lineImages.map((image, index) =>
              <View key={index}>
                {image.text ?
                  <CardViewWithImage
                    width={cardWidth}
                    imageWidth={image.width}
                    imageHeight={image.height}
                    source={image}
                    roundedImage={false}
                    content={image.text}
                  />
                  :
                  <CardViewWithImage
                    width={cardWidth}
                    imageWidth={image.width}
                    imageHeight={image.height}
                    source={image}
                    roundedImage={false}
                    onPress={() => {
                      var lines = this.state.lineImages, rawLines = this.state.rawLineImages
                      lines[index].text = 'Recognizing... Please Wait...'
                      this.setState({ lineImages: lines })

                      var pivot = rawLines[index].uri

                      RNFetchBlob.config({ trusty: true })
                        .fetch('POST', serverHeader + this.state.server + '/api/tesseract', {
                          'Content-Type': 'multipart/form-data'
                        }, [
                            { name: 'image', filename: 'image.jpg', type: 'image/foo', data: RNFetchBlob.wrap(pivot) }
                          ]).then((resp) => {
                            var result = JSON.parse(resp.data)
                            result = result.data

                            if (!result || result == '') {
                              result = 'No result (e.g. due to not enough DPI)'
                            }

                            var lines = this.state.lineImages
                            lines[index].text = 'Tesseract: ' + result

                            RNFetchBlob.config({ trusty: true })
                              .fetch('POST', serverHeader + this.state.server + '/api/crnn', {
                                'Content-Type': 'multipart/form-data'
                              }, [
                                  { name: 'image', filename: 'image.jpg', type: 'image/foo', data: RNFetchBlob.wrap(image.uri) }
                                ]).then((resp2) => {
                                  var result2 = JSON.parse(resp2.data)
                                  result2 = result2.data

                                  if (!result2 || result2 == '') {
                                    result2 = 'No result (e.g. due to not enough DPI)'
                                  }

                                  var lines = this.state.lineImages
                                  lines[index].text += '\nCRNN: ' + result2
                                  this.setState({ lineImages: lines })

                                }).catch((err) => { })

                          }).catch((err) => { })
                    }} />
                }
              </View>
            )) : null}
          </ScrollView>

          <DialogInput
            isDialogVisible={this.state.showServerAddressInput}
            title={'Server Address Config'}
            message={'Input the server address (without http(s) header):'}
            initValueTextInput={this.state.server}
            submitInput={async (inp) => {
              this.setState({ server: inp, showServerAddressInput: false })
              await AsyncStorage.setItem(SERVER_KEY, inp)
            }}
            closeDialog={() => {
              this.setState({ showServerAddressInput: false })
            }}>
          </DialogInput>

          <FlashMessage position='top' />

          <ActionButton buttonColor='rgba(231, 76, 60, 1)' offsetY={25} offsetX={25}>

            <ActionButton.Item buttonColor='#9b59b6' title='From camera' onPress={() => this.pickImageFromCamera()}>
              <IconMaterial name='camera-alt' style={styles.actionButtonIcon} />
            </ActionButton.Item>

            <ActionButton.Item buttonColor='#1abc9c' title='From file' onPress={() => this.pickImageFromFile()}>
              <IconMaterial name='image' style={styles.actionButtonIcon} />
            </ActionButton.Item>

            <ActionButton.Item buttonColor='#3498db' title='Set server address' onPress={() => { this.setState({ showServerAddressInput: true }) }}>
              <IconMaterial name='settings' style={styles.actionButtonIcon} />
            </ActionButton.Item>

          </ActionButton>

        </View>
      )
    }
  }

  pickImageFromCamera() {
    ImagePicker.launchCamera(imagePickerOptions, (response) => this.handleImagePicking(response))
  }

  pickImageFromFile() {
    ImagePicker.launchImageLibrary(imagePickerOptions, (response) => this.handleImagePicking(response))
  }

  handleImagePicking(response) {
    if (response.didCancel) {
      Alert.alert('Warning', 'The user has canceled picking image on purpose!')
    } else if (response.error) {
      Alert.alert('Error', 'Cannot get the image!')
    } else {
      var originalImage = { uri: response.uri, height: response.height, width: response.width }
      this.setState({ originalImage: originalImage, preprocessing: true })

      RNFetchBlob.config({ trusty: true })
        .fetch('POST', serverHeader + this.state.server + '/api/segment', {
          'Content-Type': 'multipart/form-data'
        }, [
            { name: 'image', filename: 'originalImage.jpg', type: 'image/foo', data: RNFetchBlob.wrap(originalImage.uri) }
          ]).then((resp) => {
            var result = JSON.parse(resp.data)
            result = result.data

            var resultImageLink = serverHeader + this.state.server + result.url

            RNFetchBlob.config({ trusty: true, fileCache: true, appendExt: 'jpg' })
              .fetch('GET', resultImageLink)
              .then((respPreprocessedImage) => {
                resultProprocessedImageUri = 'file://' + respPreprocessedImage.path()

                this.setState({ preprocessedImage: { uri: resultImageLink, width: originalImage.width, height: originalImage.height } })

                var n = result.lowers_len, lowers = result.lowers, uppers = result.uppers, lines = [], rawLines = []
                for (i = 0; i < n; ++i) {
                  var lineSize = { width: originalImage.width, height: lowers[i] - uppers[i] + 1 }
                  var displaySize = { width: cardWidth, height: (lineSize.height / lineSize.width) * cardWidth + 1 }

                  ImageEditor.cropImage(resultProprocessedImageUri, {
                    offset: { x: 0, y: uppers[i] },
                    size: lineSize,
                    displaySize: displaySize,
                    resizeMode: 'contain'
                  },
                    (uri) => {
                      lines.push({ uri: uri, width: displaySize.width, height: displaySize.height })
                      this.setState({ lineImages: lines })
                    },
                    (error) => { })

                  ImageEditor.cropImage(resultProprocessedImageUri, {
                    offset: { x: 0, y: uppers[i] },
                    size: lineSize
                  },
                    (uri) => {
                      rawLines.push({ uri: uri })
                      this.setState({ rawLineImages: rawLines })
                    },
                    (error) => { })
                }

                this.setState({ preprocessing: false })

                showMessage({
                  message: 'Usage Hint',
                  description: 'Tap an image to recognize texts in that line',
                  type: 'info',
                  duration: 2000
                })
              })
          })
    }
  }
}