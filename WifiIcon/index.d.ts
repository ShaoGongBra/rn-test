import { Component, CSSProperties } from 'react'

interface names {
  'man_add_fill'
  'man_bussiness_fill'
  'man_mine_fill'
  'man_rmb_fill'
  'inquiry-template'
  'download'
  'wechat'
  'moments_pengyouquan'
  'telecom'
  'mobile'
  'united'
  'gift-fill'
  'vip'
  'tongguan'
  'cart-Empty'
  'namecard'
  'map'
  'QRcode1'
  'service'
  'set'
  'creditcard'
  'collection'
  'Dividends'
  'writing1'
  'sales_center'
  'promot_tips'
  'help_FAQ'
  'topraning'
  'op_success'
  'tabbar_study_nor'
  'tabbar_study_fill'
  'date'
  'tabBar_car_fill'
  'tabbar_home_fill'
  'tabbar_home_nor'
  'tabBar_mine_fill'
  'tabBar_car_nor'
  'tabBar_mine_nor'
}

interface WifiIconProps {
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
export class WifiIcon extends Component<WifiIconProps> {

}
