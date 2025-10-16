<script setup>
import { CountryService } from '@/service/CountryService';
import { NodeService } from '@/service/NodeService';
import { onMounted, ref } from 'vue';

const floatValue = ref(null);
const autoValue = ref(null);
const selectedAutoValue = ref(null);
const autoFilteredValue = ref([]);
const calendarValue = ref(null);
const inputNumberValue = ref(null);
const sliderValue = ref(50);
const ratingValue = ref(null);
const colorValue = ref('#1976D2');
const radioValue = ref(null);
const checkboxValue = ref([]);
const switchValue = ref(false);
const listboxValues = ref([
    { name: 'New York', code: 'NY' },
    { name: 'Rome', code: 'RM' },
    { name: 'London', code: 'LDN' },
    { name: 'Istanbul', code: 'IST' },
    { name: 'Paris', code: 'PRS' }
]);
const listboxValue = ref(null);
const dropdownValues = ref([
    { name: 'New York', code: 'NY' },
    { name: 'Rome', code: 'RM' },
    { name: 'London', code: 'LDN' },
    { name: 'Istanbul', code: 'IST' },
    { name: 'Paris', code: 'PRS' }
]);
const dropdownValue = ref(null);
const multiselectValues = ref([
    { name: 'Australia', code: 'AU' },
    { name: 'Brazil', code: 'BR' },
    { name: 'China', code: 'CN' },
    { name: 'Egypt', code: 'EG' },
    { name: 'France', code: 'FR' },
    { name: 'Germany', code: 'DE' },
    { name: 'India', code: 'IN' },
    { name: 'Japan', code: 'JP' },
    { name: 'Spain', code: 'ES' },
    { name: 'United States', code: 'US' }
]);

const multiselectValue = ref(null);
const toggleValue = ref(false);
const selectButtonValue = ref(null);
const selectButtonValues = ref([{ name: 'Male' }, { name: 'Female' },]);
const knobValue = ref(50);
const inputGroupValue = ref(false);
const treeSelectNodes = ref(null);
const selectedNode = ref(null);

onMounted(() => {
    CountryService.getCountries().then((data) => (autoValue.value = data));
    NodeService.getTreeNodes().then((data) => (treeSelectNodes.value = data));
});

import { createClient } from '@/services/userService';

const firstName = ref('');
const lastName = ref('');
const email = ref('');
const description = ref('');
const weightValue = ref(null);
const heightValue = ref(null);

async function createClientFunction() {
    try {
        const payload = {
            firstName: firstName.value,
            lastName: lastName.value,
            email: email.value,
            gender: selectButtonValue.value ? selectButtonValue.value.name : null,
            description: description.value,
            birthDate: calendarValue.value,
            weight: weightValue.value,
            height: heightValue.value
        };

        const response = await createClient(payload);
        return response;
    } catch (error) {
        console.error('createClient error:', error);
        throw error;
    }
}

function searchCountry(event) {
    setTimeout(() => {
        if (!event.query.trim().length) {
            autoFilteredValue.value = [...autoValue.value];
        } else {
            autoFilteredValue.value = autoValue.value.filter((country) => {
                return country.name.toLowerCase().startsWith(event.query.toLowerCase());
            });
        }
    }, 250);
}
</script>

<template>
    <Fluid class="flex flex-col md:flex-row gap-8">
        <div class="md:w-1/2">
            <div class="card flex flex-col gap-4">
                <div class="font-semibold text-xl">Add new client</div>
                <label class="mb-1 font-medium">First name</label>
                <IconField>
                    <InputIcon class="pi pi-user" />
                    <InputText type="text" placeholder="First name" />
                </IconField>
                <label class="mb-1 font-medium">Last name</label>
                <IconField>
                    <InputIcon class="pi pi-user" />
                    <InputText type="text" placeholder="Last name" />
                </IconField>
                <label class="mb-1 font-medium">Email</label>
                <IconField>
                    <InputIcon class="pi pi-user" />
                    <InputText type="text" placeholder="Email" />
                </IconField>
                
                <label class="mb-1 font-medium">Gender</label>
                <SelectButton v-model="selectButtonValue" :options="selectButtonValues" optionLabel="name" />

                <div class="font-semibold text-xl">Descript client</div>
                <Textarea placeholder="Your Message" :autoResize="true" rows="3" cols="30" />

                <div class="font-semibold text-xl">Birth date</div>
                <DatePicker :showIcon="true" :showButtonBar="true" v-model="calendarValue"></DatePicker>

                <label class="mb-1 font-medium">Weight</label>
                <InputNumber v-model="inputNumberValue" showButtons mode="decimal"></InputNumber>
                <label class="mb-1 font-medium">Height</label>
                <InputNumber v-model="inputNumberValue" showButtons mode="decimal"></InputNumber>
            </div>
        </div>
        <div class="md:w-1/2">
            <div class="card flex flex-col gap-4">
                <div class="font-semibold text-xl">Listbox</div>
                <Listbox v-model="listboxValue" :options="listboxValues" optionLabel="name" :filter="true" />

                <div class="font-semibold text-xl">Select</div>
                <Select v-model="dropdownValue" :options="dropdownValues" optionLabel="name" placeholder="Select" />

                <div class="font-semibold text-xl">MultiSelect</div>
                <MultiSelect v-model="multiselectValue" :options="multiselectValues" optionLabel="name" placeholder="Select Countries" :filter="true">
                    <template #value="slotProps">
                        <div class="inline-flex items-center py-1 px-2 bg-primary text-primary-contrast rounded-border mr-2" v-for="option of slotProps.value" :key="option.code">
                            <span :class="'mr-2 flag flag-' + option.code.toLowerCase()" style="width: 18px; height: 12px" />
                            <div>{{ option.name }}</div>
                        </div>
                        <template v-if="!slotProps.value || slotProps.value.length === 0">
                            <div class="p-1">Select Countries</div>
                        </template>
                    </template>
                    <template #option="slotProps">
                        <div class="flex items-center">
                            <span :class="'mr-2 flag flag-' + slotProps.option.code.toLowerCase()" style="width: 18px; height: 12px" />
                            <div>{{ slotProps.option.name }}</div>
                        </div>
                    </template>
                </MultiSelect>

                <div class="font-semibold text-xl">TreeSelect</div>
                <TreeSelect v-model="selectedNode" :options="treeSelectNodes" placeholder="Select Item"></TreeSelect>
            </div>
        </div>
    </Fluid>

    
</template>
