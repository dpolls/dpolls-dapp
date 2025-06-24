const config = {
  api: import.meta.env.VITE_DPOLLS_API ?? 'http://localhost:3000',
  dpollsContractAddress: import.meta.env.VITE_DPOLLS_CONTRACT_ADDRESS ?? ''
}

export default config