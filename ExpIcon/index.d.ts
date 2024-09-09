import { Component, CSSProperties } from 'react'

interface names {
  'jiangpin'
  'shangpindingdan'
  'kuaididingdan'
  'gift'
  'shouye'
  'kucun'
  'dingdan'
  'dingdan1'
  'wode'
  'dingwei'
  'jikuaidi'
  'ji'
  'shou'
  'dizhibu'
  'chakuaidi'
  'right'
}

interface ExpIconProps {
  /** 图标名称 */
  name: keyof names
  /**
   * 图标颜色
   */
  color?: string
  /**
   * 图标尺寸
   */
  size?: number,
  /**
   * 样式
   */
  style?: CSSProperties
}

/**
 * WifiIcon 图标库
 */
export class ExpIcon extends Component<ExpIconProps> {

}
