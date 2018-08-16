import React from 'react'
import { createStackNavigator, Header } from 'react-navigation'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import {
  TopScreen,
  LatestScreen,
  DetailScreen,
  SettingsScreen,
  WebViewScreen,
} from '../screens'
import { LayoutConsumer, ThemeConsumer } from '../context'

// HACK: This is a hack to dynamic change header's style
const CustomHeader = props => (
  <LayoutConsumer>
    {({ layout }) => (
      <ThemeConsumer>
        {({ colors }) => {
          let headerLeft
          if (props.scene.index === 0 && layout === 'drawer') {
            headerLeft = (
              <MaterialIcons
                name="menu"
                size={24}
                color={colors.header.text}
                style={{ paddingLeft: 16 }}
                onPress={() => {
                  props.scene.descriptor.navigation.openDrawer()
                }}
              />
            )
          } else {
            // Keep headerLeft to undefined so it will use HeaderBackButton
            // https://github.com/react-navigation/react-navigation-stack/blob/master/src/views/Header/Header.js#L202
          }

          const addOptionsToScene = scene => ({
            ...scene,
            descriptor: {
              ...scene.descriptor,
              options: {
                ...scene.descriptor.options,
                headerTintColor: colors.header.text,
                headerStyle: {
                  backgroundColor: colors.header.background,
                },
                headerLeft,
              },
            },
          })

          const propsNew = {
            ...props,
            scene: addOptionsToScene(props.scene),
            scenes: [
              ...props.scenes.slice(0, -1),
              addOptionsToScene(props.scenes[props.scenes.length - 1]),
            ],
          }

          // console.log(propsNew.scenes)
          return <Header {...propsNew} />
        }}
      </ThemeConsumer>
    )}
  </LayoutConsumer>
)

export const TopNavigator = createStackNavigator(
  {
    Top: TopScreen,
    Detail: DetailScreen,
    WebView: WebViewScreen,
  },
  {
    navigationOptions: {
      title: 'Top news',
      header: CustomHeader,
    },
  },
)

export const LatestNavigator = createStackNavigator(
  {
    Latest: LatestScreen,
    Detail: DetailScreen,
    WebView: WebViewScreen,
  },
  {
    navigationOptions: {
      title: 'Latest news',
      header: CustomHeader,
    },
  },
)

export const SettingsNavigator = createStackNavigator(
  {
    Settings: SettingsScreen,
    WebView: WebViewScreen,
  },
  {
    navigationOptions: {
      title: 'Settings',
      header: CustomHeader,
    },
  },
)