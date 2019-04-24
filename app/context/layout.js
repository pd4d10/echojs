import React from 'react'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-community/async-storage'
import { STORAGE_KEYS, layoutMapping } from '../constants'

export const LayoutContext = React.createContext()

export class LayoutProvider extends React.Component {
  state = {
    layout: null,
  }

  async componentDidMount() {
    const layout = await AsyncStorage.getItem(STORAGE_KEYS.layout)
    this.setState({
      layout: this.ensureCorrect(layout),
    })
  }

  ensureCorrect = layout => {
    if (Object.keys(layoutMapping).includes(layout)) {
      return layout
    } else {
      return Platform.select({
        ios: 'bottom-tab',
        android: 'material-bottom-tab',
      })
    }
  }

  setLayout = async layout => {
    await AsyncStorage.setItem(STORAGE_KEYS.layout, layout)
    this.setState({
      layout: this.ensureCorrect(layout),
    })
  }

  render() {
    const { layout } = this.state
    const { setLayout } = this

    return (
      <LayoutContext.Provider
        value={{
          layout,
          setLayout,
          // layoutDetail: layoutMapping[layout],
        }}
      >
        {this.props.children}
      </LayoutContext.Provider>
    )
  }
}
