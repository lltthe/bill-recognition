import { StyleSheet } from 'react-native'
import dim from './dimensions'

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  imageBackground: {
    width: dim.screenWidth,
    height: dim.screenHeight,
    position: 'absolute',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    top: 0,
    left: 0
  },
  actionButtonIcon: {
    fontSize: 24,
    height: 25,
    color: 'white'
  },
  boundingRect: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FF6600'
  }
})

export default styles
export const screenHeight = dim.screenHeight
export const screenWidth = dim.screenWidth