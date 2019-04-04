import React, { Component } from 'react'
import {
  View, Alert, Image, ImageEditor, ScrollView
} from 'react-native'

import IconMaterial from 'react-native-vector-icons/MaterialIcons'
import ActionButton from 'react-native-action-button'
import ImagePicker from 'react-native-image-picker'
import { CardViewWithImage } from 'react-native-simple-card-view'
import RNFetchBlob from 'rn-fetch-blob'

import styles, { cardWidth } from './styles'

const imagePickerOptions = {
  title: null
}

// console.disableYellowBox = true

const server = 'https://capstoneproject.serveo.net', offline = true

export default class App extends Component {

  constructor() {
    super()
    this.state = {
      originalImage: null,
      preprocessedImage: null,
      lineImages: null
    }
  }

  render() {
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
                    var lines = this.state.lineImages
                    lines[index].text = 'Recognizing... Please Wait...'
                    this.setState({ lineImages: lines })

                    RNFetchBlob.config({ trusty: true })
                      .fetch('POST', server + '/api/tesseract', {
                        'Content-Type': 'multipart/form-data'
                      }, [
                          { name: 'image', filename: 'image.jpg', type: 'image/foo', data: RNFetchBlob.wrap(image.uri) }
                        ]).then((resp) => {
                          var result = JSON.parse(resp.data)
                          result = JSON.stringify(result.data)

                          var lines = this.state.lineImages
                          lines[index].text = result
                          this.setState({ lineImages: lines })

                        }).catch((err) => {
                          var lines = this.state.lineImages
                          lines[index].text = image.uri + '\nFailed to reach OCR API'
                          this.setState({ lineImages: lines })
                        })
                  }} />
              }
            </View>
          )) : null}
        </ScrollView>

        <ActionButton buttonColor='rgba(231, 76, 60, 1)' offsetY={25} offsetX={25}>

          <ActionButton.Item buttonColor='#9b59b6' title='From camera' onPress={() => this.pickImageFromCamera()}>
            <IconMaterial name='camera-alt' style={styles.actionButtonIcon} />
          </ActionButton.Item>

          <ActionButton.Item buttonColor='#1abc9c' title='From file' onPress={() => this.pickImageFromFile()}>
            <IconMaterial name='image' style={styles.actionButtonIcon} />
          </ActionButton.Item>

        </ActionButton>

      </View>
    )
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
      var result = { uri: response.uri, height: response.height, width: response.width }
      this.setState({ originalImage: result })

      RNFetchBlob.config({ trusty: true })
        .fetch('POST', server + '/api/segment', {
          'Content-Type': 'multipart/form-data'
        }, [
            { name: 'image', filename: 'originalImage.jpg', type: 'image/foo', data: RNFetchBlob.wrap(result.uri) }
          ]).then((resp) => {
            var result = JSON.parse(resp.data)
            result = result.data

            var resultImageLink = server + result.url

            Image.getSize(resultImageLink, (width, height) => {
              this.setState({ preprocessedImage: { uri: resultImageLink, width: width, height: height } })

              var n = result.lowers_len, lowers = result.lowers, uppers = result.uppers, lines = []
              for (i = 0; i < n; ++i) {
                var lineSize = { width: width, height: lowers[i] - uppers[i] + 1 }
                var displaySize = { width: cardWidth, height: (lineSize.height / lineSize.width) * cardWidth }

                ImageEditor.cropImage(resultImageLink, {
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
              }
            })

          }).catch((err) => {
            //resultImageLink = 'https://i.ibb.co/qCvjkhc/test.jpg'
            resultImageLink = this.state.originalImage.uri

            Image.getSize(resultImageLink, (width, height) => {
              this.setState({ preprocessedImage: { uri: resultImageLink, width: width, height: height } })

              var n = 29, lowers = [57, 124, 182, 243, 308, 367, 490, 554, 673, 729, 771, 846, 905, 964, 1019, 1078, 1132, 1194, 1249, 1312, 1370, 1436, 1494, 1539, 1613, 1672, 1844, 1895, 1949], uppers = [0, 62, 126, 188, 253, 318, 436, 495, 616, 676, 759, 796, 855, 914, 971, 1027, 1084, 1142, 1200, 1259, 1319, 1378, 1436, 1516, 1560, 1619, 1740, 1848, 1896], lines = []
              for (i = 0; i < 29; ++i) {
                var lineSize = { width: width, height: lowers[i] - uppers[i] + 1 }
                var displaySize = { width: cardWidth, height: (lineSize.height / lineSize.width) * cardWidth }

                ImageEditor.cropImage(resultImageLink, {
                  offset: { x: 0, y: uppers[i] },
                  size: lineSize,
                  displaySize: displaySize,
                  resizeMode: 'contain'
                },
                  (uri) => {
                    lines.push({ uri: uri, width: displaySize.width, height: displaySize.height, text: null })
                    this.setState({ lineImages: lines })
                  },
                  (error) => { })
              }
            })
          })
    }
  }

}