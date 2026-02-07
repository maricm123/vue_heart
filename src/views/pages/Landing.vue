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
