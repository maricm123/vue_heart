import { ref } from 'vue'

const tenant = ref(null)
const tenantReady = ref(false)

export function useTenant() {
  return {
    tenant,
    tenantReady
  }
}