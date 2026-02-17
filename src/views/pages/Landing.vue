<script setup lang="ts">
import { reactive, ref } from 'vue';

const scrollToContact = () => {
  const el = document.getElementById("contact");
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const form = reactive({
  name: "",
  email: "",
  company: "",
  classSize: "",
  message: "",
});

const isSubmitting = ref(false);
const isSubmitted = ref(false);

const submitDemo = async () => {
  isSubmitting.value = true;
  isSubmitted.value = false;

  try {
    // TODO: replace with your real API call (server route, Formspree, etc.)
    await new Promise((r) => setTimeout(r, 600));

    isSubmitted.value = true;
    form.name = "";
    form.email = "";
    form.company = "";
    form.classSize = "";
    form.message = "";
  } finally {
    isSubmitting.value = false;
  }
};
</script>


<template>
  <!-- HERO SECTION -->
  <section
    class="flex flex-col pt-16 px-6 lg:px-20 overflow-hidden"
    style="background: linear-gradient(0deg, rgba(255,255,255,0.15), rgba(255,255,255,0.15)), radial-gradient(77% 260% at 77% 57%, #ffd7d8 0%, #ffe8e9 100%); clip-path: ellipse(150% 87% at 93% 13%)"
  >
    <div class="mx-6 md:mx-20 mt-0 md:mt-6 max-w-3xl">
      <h1 class="text-6xl font-bold text-gray-900 leading-tight">
        <span class="font-light block">Next-Gen Heart Rate Tracking</span>
        for Modern Gyms
      </h1>
      <p class="font-normal text-2xl leading-normal md:mt-4 text-gray-700">
        HeartApp is an advanced real-time monitoring system for group workouts.
        Track heart rate, intensity zones, and performance of every member — all on one screen.
      </p>

      <!-- Added: short role/usage context (no style change, just text) -->
      <p class="font-normal text-2xl leading-normal mt-4 text-gray-700">
        Designed for <strong>coaches</strong> and <strong>gym managers</strong> to run classes, connect BLE devices, and display live metrics on a big screen.
      </p>

      <button
  class="mt-8 px-6 py-3 text-xl rounded-lg shadow-lg"
  style="background-color:#ff474c; color:white;"
  @click="scrollToContact"
>
  Book a Demo
</button>
    </div>

    <div class="flex justify-center md:justify-end mt-10">
      <img
        src="/demo/images/landing/screen-1.png"
        alt="HeartApp Dashboard"
        class="w-9/12 md:w-auto drop-shadow-2xl"
      />
    </div>
  </section>

  <!-- FEATURES SECTION -->
  <section id="features" class="py-20 px-6 lg:px-20 mx-0 lg:mx-20">
    <div class="text-center mb-20">
      <h2 class="text-5xl font-semibold text-surface-900">
        Performance-Driven Features
      </h2>
      <p class="text-muted-color text-2xl mt-2 max-w-2xl mx-auto">
        Built for gym owners who want professional monitoring and added value for their members.
      </p>
    </div>

    <div class="grid grid-cols-12 gap-8">
      <!-- Feature 1 -->
      <div class="col-span-12 lg:col-span-4">
        <div class="p-6 rounded-xl shadow-lg bg-white">
          <div
            class="flex items-center justify-center mb-6"
            style="background-color:#ffe0e1; width:4rem; height:4rem; border-radius:12px;"
          >
            <i class="pi pi-heart text-3xl" style="color:#ff474c;"></i>
          </div>
          <h3 class="text-2xl font-semibold mb-2">
            Live Heart Rate Tiles
          </h3>
          <p class="text-surface-600 text-xl">
            Real-time view of each member’s heart rate with clear color-coded zones.
          </p>
        </div>
      </div>

      <!-- Feature 2 -->
      <div class="col-span-12 lg:col-span-4">
        <div class="p-6 rounded-xl shadow-lg bg-white">
          <div
            class="flex items-center justify-center mb-6"
            style="background-color:#ffe0e1; width:4rem; height:4rem; border-radius:12px;"
          >
            <i class="pi pi-chart-line text-3xl" style="color:#ff474c;"></i>
          </div>
          <h3 class="text-2xl font-semibold mb-2">
            Zone-Based Training
          </h3>
          <p class="text-surface-600 text-xl">
            Automatic zones based on max HR — perfect for HIIT, CrossFit, spinning, and group workouts.
          </p>
        </div>
      </div>

      <!-- Feature 3 -->
      <div class="col-span-12 lg:col-span-4">
        <div class="p-6 rounded-xl shadow-lg bg-white">
          <div
            class="flex items-center justify-center mb-6"
            style="background-color:#ffe0e1; width:4rem; height:4rem; border-radius:12px;"
          >
            <i class="pi pi-desktop text-3xl" style="color:#ff474c;"></i>
          </div>
          <h3 class="text-2xl font-semibold mb-2">
            Gym Dashboard
          </h3>
          <p class="text-surface-600 text-xl">
            Large-screen view for group workouts — displays all members, zones, and progress.
          </p>
        </div>
      </div>

      <!-- Added: Feature 4 -->
      <div class="col-span-12 lg:col-span-4">
        <div class="p-6 rounded-xl shadow-lg bg-white">
          <div
            class="flex items-center justify-center mb-6"
            style="background-color:#ffe0e1; width:4rem; height:4rem; border-radius:12px;"
          >
            <i class="pi pi-users text-3xl" style="color:#ff474c;"></i>
          </div>
          <h3 class="text-2xl font-semibold mb-2">
            Client Profiles & History
          </h3>
          <p class="text-surface-600 text-xl">
            View client details, previous sessions, and performance charts — all in one place.
          </p>
        </div>
      </div>

      <!-- Added: Feature 5 -->
      <div class="col-span-12 lg:col-span-4">
        <div class="p-6 rounded-xl shadow-lg bg-white">
          <div
            class="flex items-center justify-center mb-6"
            style="background-color:#ffe0e1; width:4rem; height:4rem; border-radius:12px;"
          >
            <i class="pi pi-bluetooth text-3xl" style="color:#ff474c;"></i>
          </div>
          <h3 class="text-2xl font-semibold mb-2">
            BLE Device Pairing
          </h3>
          <p class="text-surface-600 text-xl">
            Connect BLE-enabled devices, start a session, and stream live metrics instantly.
          </p>
        </div>
      </div>

      <!-- Added: Feature 6 -->
      <div class="col-span-12 lg:col-span-4">
        <div class="p-6 rounded-xl shadow-lg bg-white">
          <div
            class="flex items-center justify-center mb-6"
            style="background-color:#ffe0e1; width:4rem; height:4rem; border-radius:12px;"
          >
            <i class="pi pi-shield text-3xl" style="color:#ff474c;"></i>
          </div>
          <h3 class="text-2xl font-semibold mb-2">
            Coach Account Controls
          </h3>
          <p class="text-surface-600 text-xl">
            Coaches can update their profile, change password, log out, or delete their account anytime.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- HIGHLIGHTS SECTION -->
  <section id="highlights" class="py-20 px-6 lg:px-20 mx-0 my-12 lg:mx-20">
    <div class="text-center mb-16">
      <h2 class="text-5xl font-semibold text-surface-900">
        How It Works in a Real Class
      </h2>
      <p class="text-muted-color text-2xl max-w-3xl mx-auto">
        A simple flow for coaches: connect the client device, start the session, and show metrics on the big screen.
      </p>
    </div>

    <div class="grid grid-cols-12 gap-10">
      <div class="col-span-12 lg:col-span-6 flex justify-center bg-red-50 p-6 rounded-xl">
        <img
          src="/demo/images/landing/mockup.svg"
          alt="HeartApp Mobile Mockup"
          class="w-10/12 drop-shadow-xl"
        />
      </div>

      <div class="col-span-12 lg:col-span-6 my-auto flex flex-col lg:items-end text-center lg:text-right gap-6">
        <div
          class="flex items-center justify-center self-center lg:self-end"
          style="background-color:#ffe0e1; width:4rem; height:4rem; border-radius:12px;"
        >
          <i class="pi pi-mobile text-3xl" style="color:#ff474c;"></i>
        </div>

        <h3 class="text-4xl font-semibold text-surface-900">
          Coach Screen + Live TV Screen
        </h3>

        <p class="text-surface-700 text-2xl max-w-xl">
          Use <strong>Coach TV Preview</strong> to connect BLE devices and start a session. Then open <strong>/livetv</strong> on a TV or projector
          for a clean, distraction-free view of live metrics.
        </p>

        <!-- Added: simple steps, same style (no new components) -->
        <div class="w-full max-w-xl">
          <div class="grid grid-cols-12 gap-4">
            <div class="col-span-12">
              <div class="p-5 rounded-xl shadow-lg bg-white">
                <h4 class="text-2xl font-semibold mb-2">1) Connect</h4>
                <p class="text-surface-600 text-xl">
                  Pair the client’s <strong>BLE device</strong> inside Coach TV Preview.
                </p>
              </div>
            </div>
            <div class="col-span-12">
              <div class="p-5 rounded-xl shadow-lg bg-white">
                <h4 class="text-2xl font-semibold mb-2">2) Start Session</h4>
                <p class="text-surface-600 text-xl">
                  Start a training session and stream live heart rate and zones instantly.
                </p>
              </div>
            </div>
            <div class="col-span-12">
              <div class="p-5 rounded-xl shadow-lg bg-white">
                <h4 class="text-2xl font-semibold mb-2">3) Display</h4>
                <p class="text-surface-600 text-xl">
                  Open <strong>/livetv</strong> on a big screen to monitor the entire class in real time.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- <p class="text-surface-700 text-2xl max-w-xl">
          Client profiles include previous sessions and charts, while important training accuracy relies on setting a client’s <strong>Max Heart Rate</strong>
          (or using the standard formula <strong>220 − age</strong>).
        </p> -->
      </div>
    </div>
  </section>

  <!-- PRICING SECTION -->
  <!-- <section id="pricing" class="py-20 px-6 lg:px-20 my-6">
    <div class="text-center mb-10">
      <h2 class="text-5xl font-semibold text-surface-900">
        Simple Pricing
      </h2>
      <p class="text-muted-color text-2xl">
        No hidden fees. No limits.
      </p>
    </div>

    <div class="grid grid-cols-12 gap-10 justify-between"> -->
      <!-- pricing cards intentionally left commented out -->
    <!-- </div>
  </section> -->

  <!-- CONTACT / DEMO SECTION (before footer) -->
<section id="contact" class="py-20 px-6 lg:px-20 mx-0 lg:mx-20">
  <div class="grid grid-cols-12 gap-10 items-start">
    <!-- Left: premium pitch -->
    <div class="col-span-12 lg:col-span-5">
      <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-surface-200 bg-white">
        <span class="w-2 h-2 rounded-full" style="background-color:#ff474c;"></span>
        <span class="text-base text-surface-700">Request a demo</span>
      </div>

      <h2 class="text-5xl font-semibold text-surface-900 mt-6 leading-tight">
        See HeartApp in action for your studio
      </h2>

      <p class="text-2xl text-surface-600 mt-4 leading-relaxed">
        We’ll walk you through the Coach screen, BLE pairing flow, and the Live TV view — tailored to your class format.
      </p>

      <div class="mt-8 space-y-4">
        <div class="flex gap-4 items-start">
          <div class="flex items-center justify-center shrink-0"
               style="background-color:#ffe0e1; width:3rem; height:3rem; border-radius:12px;">
            <i class="pi pi-clock text-2xl" style="color:#ff474c;"></i>
          </div>
          <div>
            <div class="text-xl font-semibold text-surface-900">15–30 minutes</div>
            <div class="text-lg text-surface-600">Quick walkthrough, no fluff.</div>
          </div>
        </div>

        <div class="flex gap-4 items-start">
          <div class="flex items-center justify-center shrink-0"
               style="background-color:#ffe0e1; width:3rem; height:3rem; border-radius:12px;">
            <i class="pi pi-desktop text-2xl" style="color:#ff474c;"></i>
          </div>
          <div>
            <div class="text-xl font-semibold text-surface-900">Big-screen ready</div>
            <div class="text-lg text-surface-600">Perfect for group classes and coaching.</div>
          </div>
        </div>

        <div class="flex gap-4 items-start">
          <div class="flex items-center justify-center shrink-0"
               style="background-color:#ffe0e1; width:3rem; height:3rem; border-radius:12px;">
            <i class="pi pi-shield text-2xl" style="color:#ff474c;"></i>
          </div>
          <div>
            <div class="text-xl font-semibold text-surface-900">Professional setup</div>
            <div class="text-lg text-surface-600">We’ll advise on devices and class sizing.</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right: form card -->
    <div class="col-span-12 lg:col-span-7">
      <div class="bg-white rounded-2xl shadow-lg border border-surface-200 p-8">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h3 class="text-3xl font-semibold text-surface-900">Book a demo</h3>
            <p class="text-xl text-surface-600 mt-2">
              Tell us a bit about your studio — we’ll reply with next steps.
            </p>
          </div>
        </div>

        <form class="mt-8 grid grid-cols-12 gap-5" @submit.prevent="submitDemo">
          <div class="col-span-12 md:col-span-6">
            <label class="text-lg text-surface-700">Full name</label>
            <input
              v-model="form.name"
              required
              type="text"
              class="mt-2 w-full rounded-xl border border-surface-200 px-4 py-3 text-lg outline-none focus:ring-2"
              style="--tw-ring-color: rgba(255,71,76,0.35);"
              placeholder="John Smith"
            />
          </div>

          <div class="col-span-12 md:col-span-6">
            <label class="text-lg text-surface-700">Work email</label>
            <input
              v-model="form.email"
              required
              type="email"
              class="mt-2 w-full rounded-xl border border-surface-200 px-4 py-3 text-lg outline-none focus:ring-2"
              style="--tw-ring-color: rgba(255,71,76,0.35);"
              placeholder="you@studio.com"
            />
          </div>

          <div class="col-span-12 md:col-span-7">
            <label class="text-lg text-surface-700">Gym / Studio</label>
            <input
              v-model="form.company"
              required
              type="text"
              class="mt-2 w-full rounded-xl border border-surface-200 px-4 py-3 text-lg outline-none focus:ring-2"
              style="--tw-ring-color: rgba(255,71,76,0.35);"
              placeholder="Studio name"
            />
          </div>

          <div class="col-span-12 md:col-span-5">
            <label class="text-lg text-surface-700">Typical class size</label>
            <select
              v-model="form.classSize"
              class="mt-2 w-full rounded-xl border border-surface-200 px-4 py-3 text-lg outline-none focus:ring-2 bg-white"
              style="--tw-ring-color: rgba(255,71,76,0.35);"
            >
              <option value="">Select</option>
              <option value="1-5">1–5</option>
              <option value="6-10">6–10</option>
              <option value="11-20">11–20</option>
              <option value="21-35">21–35</option>
              <option value="36+">36+</option>
            </select>
          </div>

          <div class="col-span-12">
            <label class="text-lg text-surface-700">Message (optional)</label>
            <textarea
              v-model="form.message"
              rows="4"
              class="mt-2 w-full rounded-xl border border-surface-200 px-4 py-3 text-lg outline-none focus:ring-2"
              style="--tw-ring-color: rgba(255,71,76,0.35);"
              placeholder="What devices do you use? Any specific requirements?"
            />
          </div>

          <div class="col-span-12 flex flex-col md:flex-row md:items-center gap-4 mt-2">
            <button
              type="submit"
              class="px-6 py-3 text-xl rounded-xl shadow-lg disabled:opacity-60"
              style="background-color:#ff474c; color:white;"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? "Sending…" : "Request demo" }}
            </button>

            <div class="text-lg text-surface-600">
              We typically reply within <span class="font-semibold text-surface-900">24 hours</span>.
            </div>
          </div>

          <div v-if="isSubmitted" class="col-span-12 mt-2">
            <div class="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-lg text-green-900">
              Thanks — your request was sent. We’ll get back to you shortly.
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</section>

  <!-- FOOTER SECTION -->
  <footer class="py-20 px-6 mx-0 mt-20 lg:mx-20 border-t border-surface-200">
    <div class="grid grid-cols-12 gap-8">
      <div class="col-span-12 md:col-span-3 flex flex-col items-start">
        <div class="flex items-center mb-4">
          <svg viewBox="0 0 54 40" class="h-12 mr-2" fill="#ff474c">
            <circle cx="20" cy="20" r="12" fill="#ff474c" />
          </svg>
          <h4 class="font-bold text-3xl text-surface-900">
            HeartApp
          </h4>
        </div>
        <p class="text-surface-600 text-xl max-w-xs">
          Real-time heart rate monitoring for modern gyms, studios, and fitness centers.
        </p>
      </div>
    </div>

    <div class="text-center mt-16 text-xl text-surface-600">
      © 2026 HeartApp — All rights reserved.
    </div>
  </footer>
</template>
