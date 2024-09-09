import { Text } from 'react-native'
import { useMemo } from 'react'
import { useFonts } from 'expo-font'
import icons from './icons.json'

export const WifiIcon = ({ name, color, size, style, ...props }) => {

  const [status, error] = useFonts({
    WifiIcon: 'https://pictcdn.client.jujiang.me/fonts/WifiIcon.1723431681384.ttf'
  })

  const _style = useMemo(() => {
    const sty = { ...style, fontFamily: 'WifiIcon' }
    if (color) {
      sty.color = color
    }
    if (size) {
      sty.fontSize = size
    }
    return sty
  }, [color, size, style])


  if (!icons[name]) {
    return console.log(`WifiIcon${name}图标不存在`)
  }

  if (!status) {
    return null
  }

  return <Text
    style={_style}
    {...props}
  >
    {String.fromCharCode(icons[name])}
  </Text>
}
