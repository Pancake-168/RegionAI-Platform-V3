import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.cwd()
const srcDir = join(root, 'src')

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue
      walk(full)
    } else if (entry.name.endsWith('.vue')) {
      checkFile(full)
    }
  }
}

function checkFile(file) {
  const text = readFileSync(file, 'utf8')
  const name = relative(root, file).split('\\').join('/')
  const errors = []

  const openStyles = (text.match(/<style/g) || []).length
  const closeStyles = (text.match(/<\/style>/g) || []).length
  if (openStyles !== closeStyles) {
    errors.push(
      `<style> 与 </style> 数量不匹配：${openStyles} 个 <style>，${closeStyles} 个 </style>`,
    )
  }

  const lastCloseStyle = text.lastIndexOf('</style>')
  if (lastCloseStyle !== -1) {
    const tail = text.slice(lastCloseStyle + '</style>'.length)
    if (tail.trim().length > 0) {
      errors.push('`</style>` 之后存在非空内容，CSS 跑出了 style 块')
    }
  }

  if (errors.length) {
    console.error(`[check-sfc] ${name}`)
    for (const error of errors) {
      console.error(`  - ${error}`)
    }
    process.exitCode = 1
  }
}

walk(srcDir)
if (!process.exitCode) {
  console.log('[check-sfc] 所有 .vue 文件的 SFC 结构检查通过')
}
