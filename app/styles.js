import { StyleSheet } from 'react-native'

import dim from './dimensions'

export const screenWidth = dim.screenWidth
export const cardWidth = screenWidth - 20

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center'
  },
  actionButtonIcon: {
    fontSize: 24,
    height: 25,
    color: 'white'
  }
})

export default styles