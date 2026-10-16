import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
export default tseslint.config({ignores:['dist','node_modules','playwright-report','test-results']},js.configs.recommended,...tseslint.configs.recommended,{files:['**/*.{ts,tsx}'],plugins:{'react-hooks':reactHooks,'react-refresh':reactRefresh},rules:{...reactHooks.configs.recommended.rules,'react-refresh/only-export-components':['warn',{allowConstantExport:true}], 'react-hooks/set-state-in-effect':'off'}},{files:['src/components/ui/*.tsx'],rules:{'react-refresh/only-export-components':'off'}})
