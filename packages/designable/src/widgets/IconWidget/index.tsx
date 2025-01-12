import { Tooltip } from 'ant-design-vue'
import {
  defineComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  unref,
} from 'vue-demi'
import { isStr, isObj, isFn, isPlainObj } from '@designable/shared'
import { observer } from '@formily/reactive-vue'
import {
  composeExport,
  createContext,
  useContext,
} from '@formily/antdv/esm/__builtins__'
import { cloneElement, isVNode, useStyle } from '../../shared/util'
import { usePrefix, useRegistry, useTheme } from '../../hooks'
import './styles.less'

import type { PropType, VNode } from 'vue-demi'
import type { Tooltip as TooltipProps } from 'ant-design-vue'

const IconContext = createContext<IconProviderProps>(null)

const isNumSize = (val: any) => /^[\d.]+$/.test(val)

export interface IconProviderProps {
  tooltip?: boolean
}

export interface IShadowSVGProps {
  content?: string
  width?: number | string
  height?: number | string
}

export interface IIconWidgetProps extends HTMLElement {
  tooltip?: Partial<TooltipProps>
  infer: string | VNode | { shadow: string }
  size?: number | string
}

const IconWidgetInner = observer(
  defineComponent({
    name: 'DnIconWidget',
    emits: ['click'],
    props: {
      tooltip: {
        type: [Object, String] as PropType<IIconWidgetProps['tooltip']>,
      },
      infer: {
        type: [String, Function, Object] as PropType<IIconWidgetProps['infer']>,
      },
      size: { type: [Number, String] as PropType<IIconWidgetProps['size']> },
    },
    setup(props: IIconWidgetProps, { attrs: _attrs, listeners, emit }) {
      const themeRef = useTheme()
      const IconContextRef = useContext(IconContext)
      const registry = useRegistry()
      const prefixRef = usePrefix('icon')

      return () => {
        const size = isNumSize(props.size)
          ? `${props.size}px`
          : props.size || '1em'
        const attrs = _attrs as unknown as HTMLElement
        const style = useStyle()
        const height = style?.height || size
        const width = style?.width || size

        const takeIcon = (infer: any) => {
          const theme = unref(themeRef)
          if (isStr(infer)) {
            const finded = registry.getDesignerIcon(infer)
            if (finded) {
              return takeIcon(finded)
            }
            return <img src={infer} height={height} width={width} />
          } else if (isFn(infer)) {
            return (
              <infer
                props={{ height: height, width: width, fill: 'currentColor' }}
                attrs={{ height: height, width: width, fill: 'currentColor' }}
                fill="currentColor"
              ></infer>
            )
          } else if (isVNode(infer)) {
            if (infer.tag === 'svg') {
              const Component = cloneElement(infer, {
                height,
                width,
                fill: 'currentColor',
                viewBox: infer.data?.attrs?.viewBox || '0 0 1024 1024',
                focusable: 'false',
                'aria-hidden': 'true',
              })
              return Component
            } else if (infer.tag === 'path' || infer.tag === 'g') {
              return (
                <svg
                  viewBox="0 0 1024 1024"
                  height={height}
                  width={width}
                  fill="currentColor"
                  focusable="false"
                  aria-hidden="true"
                >
                  {infer}
                </svg>
              )
            } else if (infer.componentOptions?.propsData?.content) {
              // 判断是不是 shadowSVG === IconWidget.ShadowSVG 写死了看看后续怎么修改
              return (
                <ShadowSVG
                  content={infer.componentOptions.propsData.content}
                  height={height}
                  width={width}
                ></ShadowSVG>
              )
            }
            return infer
          } else if (isPlainObj(infer)) {
            if (infer[theme]) {
              return takeIcon(infer[theme])
            }
          }
        }

        const renderTooltips = (children: any) => {
          const IconContext = unref(IconContextRef)
          if (!isStr(props.infer) && IconContext?.tooltip) return children
          const tooltip =
            props.tooltip || registry.getDesignerMessage(`icons.${props.infer}`)
          if (tooltip) {
            const props = isObj(tooltip) ? tooltip : { title: tooltip }
            return <Tooltip props={props}>{children}</Tooltip>
          }
          return children
        }
        return renderTooltips(
          <span
            attrs={{ ...attrs, infer: isStr(props.infer) && props.infer }}
            class={prefixRef.value}
            style={{
              ...style,
              cursor: listeners.click ? 'pointer' : attrs.style?.cursor,
            }}
            onClick={() => emit('click')}
          >
            {takeIcon(props.infer)}
          </span>
        )
      }
    },
  })
)

const ShadowSVG = defineComponent({
  props: {
    width: [Number, String],
    height: [Number, String],
    content: String,
  },
  setup(props: IShadowSVGProps, { refs }) {
    const refInstance = ref<HTMLDivElement>(null)
    const width = isNumSize(props.width) ? `${props.width}px` : props.width
    const height = isNumSize(props.height) ? `${props.height}px` : props.height

    onMounted(() => {
      refInstance.value = refs.ref as HTMLDivElement
      if (refInstance.value) {
        const root = refInstance.value.attachShadow({
          mode: 'open',
        })
        root.innerHTML = `<svg viewBox="0 0 1024 1024" style="width:${width};height:${height}">${props.content}</svg>`
      }
    })

    onBeforeUnmount(() => {
      // TODO::报错
      // if (!refInstance.value) return
      // refInstance.value.attachShadow({
      //   mode: 'closed',
      // })
    })

    return () => <div ref="ref"></div>
  },
})

const Provider = defineComponent({
  props: { tooltip: Boolean },
  setup(props: IconProviderProps, { slots }) {
    return () => (
      <IconContext.Provider value={props}>
        {slots.default?.()}
      </IconContext.Provider>
    )
  },
})

export const IconWidget = composeExport(IconWidgetInner, {
  ShadowSVG,
  Provider,
})
