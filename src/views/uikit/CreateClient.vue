<script setup>
import { ref, computed } from 'vue';
import { CountryService } from '@/service/CountryService';
import { NodeService } from '@/service/NodeService';
import { onMounted } from 'vue';
import { createClient } from '@/services/userService';
import MaxHeartRateField from '@/components/MaxHeartRateField.vue';

// --- phone prefixes ---
const selectedPrefix = ref('+381');
const countryPrefixes = [
    { label: 'Serbia (+381)', value: '+381' },
    { label: 'Croatia (+385)', value: '+385' },
    { label: 'BiH (+387)', value: '+387' },
    { label: 'Montenegro (+382)', value: '+382' },
    { label: 'North Macedonia (+389)', value: '+389' }
];

// --- form fields ---
const firstName = ref('');
const lastName = ref('');
const email = ref('');
const description = ref('');
const phoneNumber = ref('');
const weightValue = ref(null);
const heightValue = ref(null);
const calendarValue = ref(null); // Date or ISO string depending on your DatePicker
const selectButtonValue = ref(null); // { name: 'Male' } or { name: 'Female' }

const max_heart_rate = ref(null);

const auto_calculate_max_hr = ref(false);

// other UI state
const message = ref('');
const formError = ref(null);

// touched flags for blur-driven errors
const touched = {
    firstName: ref(false),
    lastName: ref(false),
    email: ref(false),
    phoneNumber: ref(false),
    weightValue: ref(false),
    heightValue: ref(false),
    calendarValue: ref(false),
    selectButtonValue: ref(false),
    max_heart_rate: ref(false)
};

// used to show errors after first submit attempt as well
const attemptedSubmit = ref(false);

// helper validators
function isNonEmptyString(v) {
    return typeof v === 'string' && v.trim().length > 0;
}
function isPositiveNumber(v) {
    return v !== null && v !== undefined && !Number.isNaN(Number(v)) && Number(v) > 0;
}
function isValidEmail(v) {
    if (!isNonEmptyString(v)) return false;
    // simple email regex, good enough for client-side validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}
function normalizeDateToYYYYMMDD(d) {
    if (!d) return null;
    // if it's a Date object
    if (d instanceof Date && !Number.isNaN(d.getTime())) return d.toISOString().split('T')[0];
    // if it's iso string
    try {
        const parsed = new Date(d);
        if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
    } catch (e) {}
    return null;
}

function validateMaxHeartRate(v) {
    // ✅ prazno je dozvoljeno
    if (v === null || v === undefined || v === '') return null;

    const num = Number(v);
    if (Number.isNaN(num)) return 'Max heart rate must be a number.';
    if (num > 250) return 'Max heart rate cannot be above 250.';
    if (num < 50) return 'Max heart rate cannot be below 50.';

    return null;
}

// computed: form validity
const isFormValid = computed(() => {
    return (
        isNonEmptyString(firstName.value) &&
        isNonEmptyString(lastName.value) &&
        isValidEmail(email.value) &&
        isNonEmptyString(phoneNumber.value) &&
        selectButtonValue.value &&
        isNonEmptyString(selectButtonValue.value.name) &&
        isPositiveNumber(weightValue.value) &&
        isPositiveNumber(heightValue.value) &&
        !!normalizeDateToYYYYMMDD(calendarValue.value) &&
        !validateMaxHeartRate(max_heart_rate.value)
    );
});

// helper to get field-specific error (used in template)
function getFieldError(field) {
    const show = attemptedSubmit.value || touched[field].value;
    if (!show) return null;

    switch (field) {
        case 'firstName':
            if (!isNonEmptyString(firstName.value)) return 'First name is required.';
            return null;
        case 'lastName':
            if (!isNonEmptyString(lastName.value)) return 'Last name is required.';
            return null;
        case 'email':
            if (!isNonEmptyString(email.value)) return 'Email is required.';
            if (!isValidEmail(email.value)) return 'Please enter a valid email address.';
            return null;
        case 'phoneNumber':
            if (!isNonEmptyString(phoneNumber.value)) return 'Phone number is required.';
            return null;
        case 'weightValue':
            if (!isPositiveNumber(weightValue.value)) return 'Weight must be a number greater than 0.';
            return null;
        case 'heightValue':
            if (!isPositiveNumber(heightValue.value)) return 'Height must be a number greater than 0.';
            return null;
        case 'calendarValue':
            if (!normalizeDateToYYYYMMDD(calendarValue.value)) return 'Birth date is required (YYYY-MM-DD).';
            return null;
        case 'selectButtonValue':
            if (!selectButtonValue.value || !selectButtonValue.value.name) return 'Please select gender.';
            return null;
        case 'max_heart_rate':
            return validateMaxHeartRate(max_heart_rate.value);
        default:
            return null;
    }
}

// onMounted loads optional services (kept from your original)
const autoValue = ref(null);
const treeSelectNodes = ref(null);
onMounted(() => {
    CountryService.getCountries()
        .then((data) => (autoValue.value = data))
        .catch(() => {});
    NodeService.getTreeNodes()
        .then((data) => (treeSelectNodes.value = data))
        .catch(() => {});
});

// create client function (validates client-side, formats date, maps fields)
async function createClientFunction() {
    formError.value = null;
    message.value = '';
    attemptedSubmit.value = true;

    // touch all fields to display errors if any
    Object.values(touched).forEach((r) => (r.value = true));

    if (!isFormValid.value) {
        // do not send request
        return;
    }

    // build payload mapping camelCase -> snake_case and formatting date
    const payload = {
        firstName: firstName.value,
        lastName: lastName.value,
        email: email.value,
        gender: selectButtonValue.value ? selectButtonValue.value.name : null,
        description: description.value,
        birthDate: normalizeDateToYYYYMMDD(calendarValue.value),
        phoneNumber: selectedPrefix.value + phoneNumber.value,
        weight: Number(weightValue.value),
        height: Number(heightValue.value),
        max_heart_rate: max_heart_rate.value ? Number(max_heart_rate.value) : null,
        auto_calculate_max_hr: auto_calculate_max_hr.value
    };

    try {
        const response = await createClient(payload);
        // assume backend returns something useful on success
        message.value = 'Client created successfully!';
        formError.value = null;
        attemptedSubmit.value = false;
        // clear form
        firstName.value = '';
        lastName.value = '';
        email.value = '';
        description.value = '';
        phoneNumber.value = '';
        weightValue.value = null;
        heightValue.value = null;
        calendarValue.value = null;
        selectButtonValue.value = null;
        selectedPrefix.value = '+381';
        // reset touched
        Object.values(touched).forEach((r) => (r.value = false));
        return response;
    } catch (error) {
        // backend validation errors are usually in error.response.data
        const resp = error?.response?.data;
        if (resp && typeof resp === 'object') {
            // format into readable block
            formError.value = Object.entries(resp)
                .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
                .join('\n');
        } else {
            formError.value = error?.response?.data || error.message || 'An unexpected error occurred.';
        }
        message.value = '';
        throw error;
    }
}

// small helpers for blur events to mark touched
function markTouched(name) {
    if (touched[name]) touched[name].value = true;
}
</script>

<template>
    <div>
        <!-- global success -->
        <div v-if="message" class="mb-4 p-3 bg-green-100 text-green-800 rounded">{{ message }}</div>

        <Fluid class="flex flex-col md:flex-row gap-8">
            <div class="md:w-1/2">
                <div class="card flex flex-col gap-4">
                    <div class="font-semibold text-xl">Add new client</div>

                    <!-- First name -->
                    <label class="mb-1 font-medium">First name</label>
                    <IconField>
                        <InputIcon class="pi pi-user" />
                        <InputText type="text" placeholder="First name" v-model="firstName" @blur="markTouched('firstName')" />
                    </IconField>
                    <div v-if="getFieldError('firstName')" class="text-red-600 text-sm">{{ getFieldError('firstName') }}</div>

                    <!-- Last name -->
                    <label class="mb-1 font-medium">Last name</label>
                    <IconField>
                        <InputIcon class="pi pi-user" />
                        <InputText type="text" placeholder="Last name" v-model="lastName" @blur="markTouched('lastName')" />
                    </IconField>
                    <div v-if="getFieldError('lastName')" class="text-red-600 text-sm">{{ getFieldError('lastName') }}</div>

                    <!-- Email -->
                    <label class="mb-1 font-medium">Email</label>
                    <IconField>
                        <InputIcon class="pi pi-envelope" />
                        <InputText type="text" placeholder="Email" v-model="email" @blur="markTouched('email')" />
                    </IconField>
                    <div v-if="getFieldError('email')" class="text-red-600 text-sm">{{ getFieldError('email') }}</div>

                    <!-- Phone -->
                    <label class="mb-1 font-medium">Phone number</label>
                    <IconField>
                        <InputGroup>
                            <Dropdown v-model="selectedPrefix" :options="countryPrefixes" optionLabel="label" optionValue="value" class="w-28" />
                            <InputText v-model="phoneNumber" placeholder="Phone number" class="w-full" @blur="markTouched('phoneNumber')" />
                        </InputGroup>
                    </IconField>
                    <div v-if="getFieldError('phoneNumber')" class="text-red-600 text-sm">{{ getFieldError('phoneNumber') }}</div>

                    <!-- Gender -->
                    <label class="mb-1 font-medium">Gender</label>
                    <SelectButton v-model="selectButtonValue" :options="[{ name: 'Male' }, { name: 'Female' }]" optionLabel="name" @blur="markTouched('selectButtonValue')" />
                    <div v-if="getFieldError('selectButtonValue')" class="text-red-600 text-sm">{{ getFieldError('selectButtonValue') }}</div>

                    <!-- Birth date -->
                    <label class="mb-1 font-medium mt-4">Birth date</label>
                    <DatePicker v-model="calendarValue" :showIcon="true" :showButtonBar="true" @blur="markTouched('calendarValue')" />
                    <div v-if="getFieldError('calendarValue')" class="text-red-600 text-sm">{{ getFieldError('calendarValue') }}</div>

                    <!-- Weight -->
                    <label class="mb-1 font-medium mt-4">Weight (kg)</label>
                    <InputNumber v-model="weightValue" showButtons mode="decimal" @blur="markTouched('weightValue')" />
                    <div v-if="getFieldError('weightValue')" class="text-red-600 text-sm">{{ getFieldError('weightValue') }}</div>

                    <!-- Height -->
                    <label class="mb-1 font-medium">Height (cm)</label>
                    <InputNumber v-model="heightValue" showButtons mode="decimal" @blur="markTouched('heightValue')" />
                    <div v-if="getFieldError('heightValue')" class="text-red-600 text-sm">{{ getFieldError('heightValue') }}</div>
                    <!-- Description -->
                    <label class="mb-1 font-medium mt-4">Additional Informations</label>
                    <Textarea placeholder="Informations" v-model="description" :autoResize="true" rows="3" cols="30" />
                </div>
            </div>

            <div class="md:w-1/2">
                <div class="card flex flex-col gap-4">
                    <div class="font-semibold text-xl">Other metrics</div>
                    <MaxHeartRateField v-model="max_heart_rate" :autoCalculate="auto_calculate_max_hr" @update:autoCalculate="auto_calculate_max_hr = $event" :touched="touched.max_heart_rate" @blur="markTouched('max_heart_rate')" />
                </div>

                <!-- backend errors -->
                <!-- <div v-if="formError" class="p-3 bg-red-100 text-red-700 rounded-md whitespace-pre-line my-4">
          {{ formError }}
        </div> -->

                <div class="w-full">
                    <div class="card flex justify-end">
                        <Button label="Create client" icon="pi pi-check" class="p-button-success" :disabled="!isFormValid" @click="createClientFunction" />
                    </div>
                </div>
            </div>
        </Fluid>
    </div>
</template>

<style scoped>
/* small styling helpers for inline messages */
.text-red-600 {
    color: #dc2626;
}
.whitespace-pre-line {
    white-space: pre-line;
}
</style>
