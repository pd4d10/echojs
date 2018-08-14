import React from 'react'
import {
  StyleSheet,
  Text,
  ActivityIndicator,
  View,
  Button,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
} from 'react-native'
import { createStackNavigator, Header } from 'react-navigation'
import { Toast } from 'native-base'
import distanceInWords from 'date-fns/distance_in_words'
import SafariView from 'react-native-safari-view'
import { parse } from 'url'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { MyActivityIndicator } from './utils'
import { ThemeContext, LayoutContext } from './App'
import DetailScreen from './detail'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'

const PAGE_SIZE = 30

export class ListItem extends React.PureComponent {
  static defaultProps = {
    hasCommentLink: true,
  }

  isText = () => {
    return this.props.item.url.startsWith('text://')
  }

  onPressTitle = async item => {
    if (this.isText()) {
      this.props.navigation.navigate('Detail', item)
      return
    }

    if (await this.isSafariViewAvailable()) {
      SafariView.show({
        url: item.url,
        tintColor: this.props.colors.primary,
        // barTintColor: this.props.colors.background,
      })
    } else {
    }
  }

  isSafariViewAvailable = async () => {
    try {
      return await SafariView.isAvailable()
    } catch (err) {
      return false
    }
  }

  setStatusBarToDark = () => {
    StatusBar.setBarStyle('dark-content')
  }

  setStatusBarToLight = () => {
    StatusBar.setBarStyle('light-content')
  }

  async componentDidMount() {
    if (await this.isSafariViewAvailable()) {
      SafariView.addEventListener('onShow', this.setStatusBarToDark)
      SafariView.addEventListener('onDismiss', this.setStatusBarToLight)
    }
  }

  async componentWillUnmount() {
    if (await this.isSafariViewAvailable()) {
      SafariView.removeEventListener('onShow', this.setStatusBarToDark)
      SafariView.removeEventListener('onDismiss', this.setStatusBarToLight)
    }
  }

  render() {
    const now = Date.now()
    const { item, hasCommentLink, colors } = this.props

    return (
      <View
        style={{
          flexDirection: 'row',
          padding: 10,
        }}
      >
        <View style={{ flex: 1 }}>
          <TouchableOpacity onPress={() => this.onPressTitle(item)}>
            <Text
              style={{
                fontSize: 18,
                lineHeight: 22,
                color: colors.primaryText,
                marginBottom: 6,
              }}
            >
              {item.title}
            </Text>
            {this.isText() || (
              <Text
                style={{
                  color: colors.greyText,
                  fontSize: 12,
                  marginBottom: 6,
                }}
              >
                at {parse(item.url).host}
              </Text>
            )}
          </TouchableOpacity>
          <Text style={{ color: colors.secondaryText, fontSize: 14 }}>
            <Text
              style={{
                textDecorationLine: 'underline',
              }}
            >
              {item.username}
            </Text>{' '}
            | {distanceInWords(parseInt(item.ctime, 10) * 1000, now)} ago
          </Text>
        </View>
        <View
          style={{
            justifyContent: 'space-between',
            width: 44,
            marginTop: 2,
            paddingLeft: 10,
          }}
        >
          <View>
            <Text style={{ color: colors.secondaryText }}>▲ {item.up}</Text>
            <Text style={{ color: colors.secondaryText }}>▼ {item.down}</Text>
          </View>
          {hasCommentLink && (
            <TouchableOpacity
              style={{ flexDirection: 'row' }}
              onPress={() => this.props.navigation.navigate('Detail', item)}
            >
              <MaterialCommunityIcons
                name="comment-processing-outline"
                size={14}
                style={{ marginRight: 2, marginTop: 3 }}
                color={colors.secondaryText}
              />
              <Text style={{ color: colors.secondaryText }}>
                {item.comments}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    )
  }
}

class ListScreen extends React.Component {
  state = {
    isFirstTimeLoading: false,
    isRefreshing: false,
    isLoadingMore: false,
    items: [],
    isEnd: false,
  }

  fetchData = async (anchor = 0) => {
    // For slow network testing
    // await new Promise(resolve => {
    //   setTimeout(resolve, 3000)
    // })
    const res = await fetch(
      `https://echojs.com/api/getnews/${
        this.props.sort
      }/${anchor}/${PAGE_SIZE}`,
    )
    const json = await res.json()
    return json.news
  }

  componentDidMount() {
    this.handleFirstTimeFetch()
  }

  handleError = err => {
    alert(err.message)
  }

  handleFirstTimeFetch = async () => {
    try {
      this.setState({ isFirstTimeLoading: true })
      const items = await this.fetchData()
      this.setState({
        items,
        isEnd: items.length < PAGE_SIZE,
      })
    } catch (err) {
      this.handleError(err)
    } finally {
      this.setState({ isFirstTimeLoading: false })
    }
  }

  handleRefresh = async () => {
    if (this.state.isRefreshing) return

    try {
      this.setState({ isRefreshing: true })
      const items = await this.fetchData()
      this.setState({
        items,
        isEnd: items.length < PAGE_SIZE,
      })
      Toast.show({
        text: 'Refresh success',
        position: 'top',
        duration: 2000,
      })
    } catch (err) {
      this.handleError(err)
    } finally {
      this.setState({ isRefreshing: false })
    }
  }

  handleLoadMore = async () => {
    if (this.state.isLoadingMore || this.state.isEnd) return
    try {
      this.setState({ isLoadingMore: true })
      const items = await this.fetchData(this.state.items.length)
      this.setState(state => ({
        items: [...state.items, ...items],
        isEnd: items.length < PAGE_SIZE,
      }))
    } catch (err) {
      this.handleError(err)
    } finally {
      this.setState({ isLoadingMore: false })
    }
  }

  render() {
    return (
      <ThemeContext.Consumer>
        {({ colors }) => (
          <SafeAreaView
            style={{
              backgroundColor: colors.background,
              flex: 1,
              justifyContent: 'center',
            }}
          >
            {this.state.isFirstTimeLoading ? (
              <MyActivityIndicator size="large" />
            ) : (
              <FlatList
                data={this.state.items}
                renderItem={({ item }) => (
                  <ListItem
                    item={item}
                    navigation={this.props.navigation}
                    colors={colors}
                  />
                )}
                keyExtractor={item => item.id}
                ItemSeparatorComponent={() => (
                  <View
                    style={{
                      height: 1,
                      backgroundColor: colors.border,
                    }}
                  />
                )}
                refreshing={this.state.isRefreshing}
                onRefresh={this.handleRefresh}
                onEndReached={this.handleLoadMore}
                onEndReachedThreshold={0.1}
                ListFooterComponent={() => (
                  <View
                    style={{
                      paddingVertical: 20,
                      borderTopWidth: 1,
                      borderColor: colors.border,
                      alignItems: 'center',
                    }}
                  >
                    {this.state.isLoadingMore ? (
                      <MyActivityIndicator />
                    ) : this.state.isEnd ? (
                      <Text>--- No more data ---</Text>
                    ) : null}
                  </View>
                )}
              />
            )}
          </SafeAreaView>
        )}
      </ThemeContext.Consumer>
    )
  }
}

const MenuLeft = ({ navigation, colors }) => (
  <MaterialIcons
    name="menu"
    size={24}
    color={colors.background}
    style={{ paddingLeft: 16 }}
    onPress={() => {
      navigation.openDrawer()
    }}
  />
)

export const MyHeader = props => (
  <LayoutContext.Consumer>
    {({ layout }) => (
      <ThemeContext.Consumer>
        {({ colors }) => {
          // HACK: This is a hack to dynamic change header's style
          const { descriptor } = props.scene
          // console.log(descriptor.options)

          let headerLeft
          if (props.scene.index === 0) {
            if (layout === 'android') {
              headerLeft = (
                <MenuLeft navigation={descriptor.navigation} colors={colors} />
              )
            } else {
              headerLeft = null
            }
          } else {
            // Keep headerLeft to undefined so it will use HeaderBackButton
            // https://github.com/react-navigation/react-navigation-stack/blob/master/src/views/Header/Header.js#L202
          }

          descriptor.options = {
            ...descriptor.options,
            headerTintColor: '#fff',
            headerStyle: {
              backgroundColor: colors.primary,
            },
            headerLeft,
          }
          return <Header {...props} />
        }}
      </ThemeContext.Consumer>
    )}
  </LayoutContext.Consumer>
)

export const TopScreen = createStackNavigator(
  {
    Top: props => <ListScreen {...props} sort="top" />,
    Detail: DetailScreen,
  },
  {
    initialRouteName: 'Top',
    navigationOptions: {
      title: 'Top news',
      header: MyHeader,
    },
  },
)

export const LatestScreen = createStackNavigator(
  {
    Top: props => <ListScreen {...props} sort="latest" />,
    Detail: DetailScreen,
  },
  {
    initialRouteName: 'Top',
    navigationOptions: {
      title: 'Latest news',
      header: MyHeader,
    },
  },
)
