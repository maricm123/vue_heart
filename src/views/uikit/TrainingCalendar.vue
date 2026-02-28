<script setup>
import { ref, onMounted } from 'vue';
import { getTrainingSessionsPerCoach } from '@/services/trainingSessionsService';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import Skeleton from 'primevue/skeleton';

const router = useRouter();
const loading = ref(true);
const selectedDate = ref(new Date());
const trainingSessions = ref([]);
const sessionsMap = ref({});

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

onMounted(async () => {
  try {
    const res = await getTrainingSessionsPerCoach();
    trainingSessions.value = res;
    buildSessionsMap();
  } catch (err) {
    console.error('Failed to load training sessions:', err);
  } finally {
    loading.value = false;
  }
});

function buildSessionsMap() {
  sessionsMap.value = {};
  trainingSessions.value.forEach(session => {
    const dateStr = session.start ? new Date(session.start).toISOString().split('T')[0] : null;
    if (dateStr) {
      if (!sessionsMap.value[dateStr]) {
        sessionsMap.value[dateStr] = [];
      }
      sessionsMap.value[dateStr].push(session);
    }
  });
}

function getDaysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getFirstDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}

function previousMonth() {
  selectedDate.value = new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth() - 1, 1);
}

function nextMonth() {
  selectedDate.value = new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth() + 1, 1);
}

function goToToday() {
  selectedDate.value = new Date();
}

function selectDate(day) {
  selectedDate.value = new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth(), day);
}

function getSessionsForDate(day) {
  const dateStr = `${selectedDate.value.getFullYear()}-${String(selectedDate.value.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return sessionsMap.value[dateStr] || [];
}

function openSessionDetail(sessionId) {
  router.push({ name: 'trainingSessionDetail', params: { id: sessionId }, query: { from: 'calendar' } });
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function isToday(day) {
  const today = new Date();
  return (
    day === today.getDate() &&
    selectedDate.value.getMonth() === today.getMonth() &&
    selectedDate.value.getFullYear() === today.getFullYear()
  );
}

function isSelected(day) {
  return day === selectedDate.value.getDate();
}
</script>

<template>
  <div v-if="loading" class="card p-4">
    <Skeleton height="3rem" class="mb-2" />
    <div class="text-xl font-bold mb-4">Training Calendar</div>
    <div class="flex flex-col gap-3">
      <div class="h-96 rounded-lg bg-gray-200 animate-pulse"></div>
    </div>
  </div>

  <div v-else>
    <Fluid>
      <!-- Header -->
      <!-- <div class="calendar-header">
        <button class="header-back" @click="router.back()" aria-label="Back">
          <i class="pi pi-arrow-left"></i>
        </button>
        <h1 class="header-title">Training Calendar</h1>
      </div> -->

      <!-- Calendar Container -->
      <div class="calendar-container">
        <!-- Month Navigation -->
        <div class="month-navigation">
          <Button icon="pi pi-chevron-left" text rounded @click="previousMonth" />
          <div class="month-display">
            <h2>{{ monthNames[selectedDate.getMonth()] }} {{ selectedDate.getFullYear() }}</h2>
          </div>
          <Button icon="pi pi-chevron-right" text rounded @click="nextMonth" />
          <Button label="Today" text @click="goToToday" class="ml-4" />
        </div>

        <!-- Calendar Grid -->
        <div class="calendar-grid">
          <!-- Day names -->
          <div v-for="day in dayNames" :key="day" class="calendar-day-header">
            {{ day }}
          </div>

          <!-- Days -->
          <template v-for="(day, index) in getDaysInMonth(selectedDate) + getFirstDayOfMonth(selectedDate)" :key="day">
            <!-- Empty cells before first day -->
            <div v-if="index < getFirstDayOfMonth(selectedDate)" class="calendar-day empty"></div>

            <!-- Actual day cells -->
            <div
              v-else
              :class="[
                'calendar-day',
                { 'today': isToday(day - getFirstDayOfMonth(selectedDate)), 'selected': isSelected(day - getFirstDayOfMonth(selectedDate)), 'has-sessions': getSessionsForDate(day - getFirstDayOfMonth(selectedDate)).length > 0 }
              ]"
              @click="selectDate(day - getFirstDayOfMonth(selectedDate))"
            >
              <div class="day-number">{{ day - getFirstDayOfMonth(selectedDate) }}</div>

              <!-- Sessions count badge -->
              <div
                v-if="getSessionsForDate(day - getFirstDayOfMonth(selectedDate)).length > 0"
                class="sessions-badge"
              >
                {{ getSessionsForDate(day - getFirstDayOfMonth(selectedDate)).length }}
              </div>
            </div>
          </template>
        </div>

        <!-- Sessions for selected date -->
        <div v-if="selectedDate" class="selected-date-sessions">
          <h3 class="sessions-title">
            Sessions on {{ selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }}
          </h3>

          <div v-if="getSessionsForDate(selectedDate.getDate()).length > 0" class="sessions-list">
            <div
              v-for="session in getSessionsForDate(selectedDate.getDate())"
              :key="session.id"
              class="session-card"
              @click="openSessionDetail(session.id)"
            >
              <div class="session-info">
                <h4 class="session-title">{{ session.title }}</h4>
                <p class="session-time">
                  <i class="pi pi-clock mr-2"></i>
                  {{ formatDate(session.start) }}
                </p>
              </div>
              <Button icon="pi pi-arrow-right" text rounded />
            </div>
          </div>

          <div v-else class="no-sessions">
            <i class="pi pi-inbox"></i>
            <p>No training sessions on this date</p>
          </div>
        </div>
      </div>
    </Fluid>
  </div>
</template>

<style scoped>
.calendar-header {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--surface-0);
  border-bottom: 1px solid var(--surface-200);
  margin-bottom: 20px;
}

.header-back {
  border: none;
  background: transparent;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.header-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.calendar-container {
  background: var(--surface-0);
  border: 1px solid var(--surface-200);
  border-radius: 12px;
  padding: 24px;
}

.month-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 12px;
}

.month-display {
  flex: 1;
  text-align: center;
}

.month-display h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 32px;
}

.calendar-day-header {
  text-align: center;
  font-weight: 700;
  font-size: 13px;
  padding: 12px 8px;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.calendar-day {
  aspect-ratio: 1;
  border: 1px solid var(--surface-200);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  background: var(--surface-50);
}

.calendar-day:hover:not(.empty) {
  border-color: var(--primary-color);
  background: var(--primary-50);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.calendar-day.empty {
  cursor: default;
  background: transparent;
  border: none;
}

.calendar-day.today {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  border-color: #4CAF50;
  color: white;
  font-weight: 700;
}

.calendar-day.selected {
  background: linear-gradient(135deg, #2196F3, #1976D2);
  border-color: #1976D2;
  color: white;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
}

.calendar-day.today.selected {
  background: linear-gradient(135deg, #4CAF50, #45a049);
}

.calendar-day.has-sessions:not(.today):not(.selected) {
  border-color: #FF9800;
  background: #FFF3E0;
}

.day-number {
  font-size: 16px;
  font-weight: 600;
}

.sessions-badge {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  background: #FF9800;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
}

.selected-date-sessions {
  background: var(--surface-50);
  border: 1px solid var(--surface-200);
  border-radius: 12px;
  padding: 20px;
}

.sessions-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 700;
}

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.session-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: var(--surface-0);
  border: 1px solid var(--surface-200);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.session-card:hover {
  border-color: var(--primary-color);
  background: var(--primary-50);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transform: translateX(4px);
}

.session-info {
  flex: 1;
}

.session-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-color);
}

.session-time {
  margin: 0;
  font-size: 12px;
  opacity: 0.7;
  display: flex;
  align-items: center;
}

.no-sessions {
  text-align: center;
  padding: 40px 20px;
  opacity: 0.5;
}

.no-sessions i {
  font-size: 32px;
  margin-bottom: 12px;
  display: block;
}

.no-sessions p {
  margin: 0;
  font-size: 14px;
}
</style>
