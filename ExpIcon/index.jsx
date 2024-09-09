import { Text } from 'react-native'
import { useMemo } from 'react'
import { useFonts } from 'expo-font'
import icons from './icons.json'

export const ExpIcon = ({ name, color, size, style, ...props }) => {

  const [status, error] = useFonts({
    ExpIcon: 'https://pictcdn.client.jujiang.me/fonts/ExpIcon.1725868491420.ttf'
  })

  const _style = useMemo(() => {
    const sty = { ...style, fontFamily: 'ExpIcon' }
    if (color) {
      sty.color = color
    }
    if (size) {
      sty.fontSize = size
    }
    return sty
  }, [color, size, style])


  if (!icons[name]) {
    return console.log(`ExpIcon${name}图标不存在`)
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
