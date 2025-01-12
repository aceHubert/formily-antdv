// import React, { Fragment, useState } from 'react'
import { observer } from '@formily/reactive-vue'
import { Tabs } from 'ant-design-vue'
import { TreeNode, createBehavior, createResource } from '@designable/core'
import {
  useNodeIdProps,
  useTreeNode,
  TreeNodeWidget,
  DroppableWidget,
  useSelection,
} from '@formily/antdv-designable'
import { composeExport } from '@formily/antdv/esm/__builtins__'
import { defineComponent, ref } from 'vue-demi'
import { uid } from '@designable/shared'
import { LoadTemplate } from '../../common/LoadTemplate'
import { useDropTemplate } from '../../hooks'
import { createVoidFieldSchema } from '../Field'
import { AllSchemas } from '../../schemas'
import { AllLocales } from '../../locales'
import { matchComponent } from '../../shared'
import type { VueComponent } from '@formily/vue'
import type { DnFC } from '@formily/antdv-designable'
// import type { Tabs as TabsProps } from 'ant-design-vue'

const parseTabs = (parent: TreeNode) => {
  const tabs: TreeNode[] = []
  parent.children.forEach((node) => {
    if (matchComponent(node, 'FormTab.TabPane')) {
      tabs.push(node)
    }
  })
  return tabs
}

const getCorrectActiveKey = (activeKey: string, tabs: TreeNode[]) => {
  if (tabs.length === 0) return
  if (tabs.some((node) => node.id === activeKey)) return activeKey
  return tabs[tabs.length - 1].id
}
//  {
//   TabPane?: VueComponent<TabPaneProps>
// }
export const FormTab: DnFC<VueComponent> & {
  TabPane?: VueComponent
} = composeExport(
  observer(
    defineComponent({
      setup(props, { attrs }) {
        const activeKeyRef = ref<string>()
        const nodeIdRef = useNodeIdProps()
        const nodeRef = useTreeNode()
        const selectionRef = useSelection()
        const designerRef = useDropTemplate('FormTab', (source) => {
          return [
            new TreeNode({
              componentName: 'Field',
              props: {
                type: 'void',
                'x-component': 'FormTab.TabPane',
                'x-component-props': {
                  label: `Unnamed Title`,
                },
              },
              children: source,
            }),
          ]
        })

        const setActiveKey = (value) => {
          activeKeyRef.value = value
          selectionRef.value.select(value)
        }
        return () => {
          const activeKey = activeKeyRef.value
          const nodeId = nodeIdRef.value
          const node = nodeRef.value
          const designer = designerRef.value

          const tabs = parseTabs(node)
          const renderTabs = () => {
            if (!node.children?.length) return <DroppableWidget />
            return (
              <Tabs
                attrs={attrs}
                value={getCorrectActiveKey(activeKey, tabs)}
                onInput={(id) => {
                  setActiveKey(id)
                }}
              >
                {tabs.map((tab) => {
                  const props = tab.props['x-component-props'] || {}
                  return (
                    <Tabs.TabPane
                      attrs={{
                        [designer.props.nodeIdAttrName]: tab.id,
                      }}
                      style={{ ...props.style }}
                      name={tab.id}
                      key={tab.id}
                      scopedSlots={{
                        tab: () => (
                          <span
                            data-content-editable="x-component-props.label"
                            data-content-editable-node-id={tab.id}
                          >
                            {props.label}
                          </span>
                        ),
                      }}
                    >
                      <div
                        key={uid()}
                        style={{
                          padding: '20px 0',
                        }}
                      >
                        {tab.children.length ? (
                          <TreeNodeWidget node={tab} />
                        ) : (
                          <DroppableWidget node={tab} />
                        )}
                      </div>
                    </Tabs.TabPane>
                  )
                })}
              </Tabs>
            )
          }
          return (
            <div attrs={nodeId}>
              {renderTabs()}
              <LoadTemplate
                actions={[
                  {
                    title: node.getMessage('addTabPane'),
                    icon: 'AddPanel',
                    onClick: () => {
                      const tabPane = new TreeNode({
                        componentName: 'Field',
                        props: {
                          type: 'void',
                          'x-component': 'FormTab.TabPane',
                          'x-component-props': {
                            label: `Unnamed Title`,
                          },
                        },
                      })
                      node.append(tabPane)
                      setActiveKey(tabPane.id)
                    },
                  },
                ]}
              />
            </div>
          )
        }
      },
    })
  ),
  {
    Behavior: createBehavior(
      {
        name: 'FormTab',
        extends: ['Field'],
        selector: (node) => node.props['x-component'] === 'FormTab',
        designerProps: {
          droppable: true,
          allowAppend: (target, source) =>
            target.children.length === 0 ||
            source.every(
              (node) => node.props['x-component'] === 'FormTab.TabPane'
            ),
          propsSchema: createVoidFieldSchema(AllSchemas.FormTab),
        },
        designerLocales: AllLocales.FormTab,
      },
      {
        name: 'FormTab.TabPane',
        extends: ['Field'],
        selector: (node) => node.props['x-component'] === 'FormTab.TabPane',
        designerProps: {
          droppable: true,
          allowDrop: (node) => node.props['x-component'] === 'FormTab',
          propsSchema: createVoidFieldSchema(AllSchemas.FormTab.TabPane),
        },
        designerLocales: AllLocales.FormTabPane,
      }
    ),
    Resource: createResource({
      icon: 'TabSource',
      elements: [
        {
          componentName: 'Field',
          props: {
            type: 'void',
            'x-component': 'FormTab',
          },
        },
      ],
    }),
  }
)
