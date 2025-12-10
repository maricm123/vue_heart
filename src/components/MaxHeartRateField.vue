<script setup>
import { computed } from 'vue';

const props = defineProps({
    modelValue: { type: Number, default: null },        // max_heart_rate
    autoCalculate: { type: Boolean, default: false },   // auto_calculate_max_hr
    touched: { type: Boolean, default: false }          // show validation
});

const emits = defineEmits(['update:modelValue', 'update:autoCalculate', 'blur']);

function validateMaxHeartRate(v) {
    if (v === null || v === '' || v === undefined) return null;
    const num = Number(v);
    if (Number.isNaN(num)) return 'Max heart rate must be a number.';
    if (num > 250) return 'Max heart rate cannot be above 250.';
    if (num < 50) return 'Max heart rate cannot be below 50.';
    return null;
}

const error = computed(() => {
    if (!props.touched) return null;
    return validateMaxHeartRate(props.modelValue);
});
</script>

<template>
    <div>
        <label class="mb-4 mt-4 font-medium">Maximal heart rate</label>

        <InputNumber
            :modelValue="modelValue"
            :useGrouping="false"
            showButtons
            mode="decimal"
            @update:modelValue="$emit('update:modelValue', $event)"
            @blur="$emit('blur')"
        />

        <div v-if="error" class="text-red-600 text-sm">{{ error }}</div>

        <div class="mt-3">
            If you don't have an accurate value, you can enable the option below:
        </div>

        <div class="flex items-center mt-2">
            <Checkbox
                :modelValue="autoCalculate"
                :binary="true"
                @update:modelValue="$emit('update:autoCalculate', $event)"
            />
            <label class="ml-2">Auto calculate maximal heart rate based on age</label>
        </div>

        <Fieldset legend="How this setting works" :toggleable="true" class="mt-4">
            <p class="leading-normal m-0">
                The maximal heart rate field is used to calculate training zones and the % of maximum effort shown in LiveTV and reports. 
                If you enter a value here, that manual value will always be used.
            </p>

            <p class="leading-normal mt-3">
                If you leave this field empty and enable “Auto calculate maximal heart rate based on age”, the system will estimate 
                the client’s maximal heart rate from their age using a standard formula.
            </p>

            <p class="leading-normal mt-3">
                If you leave the field empty and do <strong>not</strong> enable the auto calculation option, the client will only see
                their raw heart rate without zones.
            </p>
        </Fieldset>
    </div>
</template>

<style scoped>
.text-red-600 {
    color: #dc2626;
}
</style>
