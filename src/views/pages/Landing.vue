<!-- <script setup lang="ts">
import FeaturesWidget from '@/components/landing/FeaturesWidget.vue';
import FooterWidget from '@/components/landing/FooterWidget.vue';
import HeroWidget from '@/components/landing/HeroWidget.vue';
import HighlightsWidget from '@/components/landing/HighlightsWidget.vue';
import PricingWidget from '@/components/landing/PricingWidget.vue';
import TopbarWidget from '@/components/landing/TopbarWidget.vue';
</script>

<template>
    <div class="bg-surface-0 dark:bg-surface-900">
        <div id="home" class="landing-wrapper overflow-hidden">
            <div class="py-6 px-6 mx-0 md:mx-12 lg:mx-20 lg:px-20 flex items-center justify-between relative lg:static">
                <TopbarWidget />
            </div>
            <HeroWidget />
            <FeaturesWidget />
            <HighlightsWidget />
            <PricingWidget />
            <FooterWidget />
        </div>
    </div>
</template> -->

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
        HeartApp je napredni real-time monitoring sistem za grupne treninge.
        Pratite puls, zone intenziteta i performanse svakog člana — sve na jednom ekranu.
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
      <h2 class="text-5xl font-semibold text-surface-900">Performance-Driven Features</h2>
      <p class="text-muted-color text-2xl mt-2 max-w-2xl mx-auto">
        Kreirano za vlasnike teretana koji žele profesionalni monitoring i dodatnu vrednost za svoje članove.
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
          <h3 class="text-2xl font-semibold mb-2">Live Heart Rate Tiles</h3>
          <p class="text-surface-600 text-xl">
            Real-time pregled pulsa svakog člana sa jasnim bojama zona.
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
          <h3 class="text-2xl font-semibold mb-2">Zone-Based Training</h3>
          <p class="text-surface-600 text-xl">
            Automatske zone prema max HR — idealno za HIIT, CrossFit, spinning i grupne treninge.
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
          <h3 class="text-2xl font-semibold mb-2">Gym Dashboard</h3>
          <p class="text-surface-600 text-xl">
            Veliki ekran za grupne treninge — prikazuje sve članove, zone i napredak.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- HIGHLIGHTS SECTION -->
  <section id="highlights" class="py-20 px-6 lg:px-20 mx-0 my-12 lg:mx-20">
    <div class="text-center mb-16">
      <h2 class="text-5xl font-semibold text-surface-900">Built for Professional Gyms</h2>
      <p class="text-muted-color text-2xl max-w-2xl mx-auto">
        HeartApp je posebno kreiran za trenere koji vode high-intensity grupne programe.
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
        <h3 class="text-4xl font-semibold text-surface-900">Real-Time Client Data</h3>
        <p class="text-surface-700 text-2xl max-w-xl">
          U svakom trenutku vidite puls, kalorije, zone i vreme treninga za sve članove.
        </p>
      </div>
    </div>
  </section>

  <!-- PRICING SECTION -->
  <section id="pricing" class="py-20 px-6 lg:px-20 my-6">
    <div class="text-center mb-10">
      <h2 class="text-5xl font-semibold text-surface-900">Simple Pricing</h2>
      <p class="text-muted-color text-2xl">Bez skrivenih troškova. Bez ograničenja.</p>
    </div>

    <div class="grid grid-cols-12 gap-10 justify-between">
      <!-- Free -->
      <div class="col-span-12 lg:col-span-4">
        <div class="p-6 rounded-xl border-2 shadow-sm hover:shadow-xl transition-all bg-white">
          <h3 class="text-center text-3xl mt-4 mb-6">Free</h3>
          <img src="/demo/images/landing/free.svg" class="w-9/12 mx-auto" />
          <div class="text-center my-6">
            <div class="text-5xl font-bold">$0</div>
            <div class="text-surface-600">per month</div>
          </div>
          <button
            class="w-full py-3 rounded-lg text-xl mb-6"
            style="background-color:#ff474c;color:white;"
          >
            Get Started
          </button>
        </div>
      </div>

      <!-- Gym -->
      <div class="col-span-12 lg:col-span-4">
        <div class="p-6 rounded-xl border-2 shadow-sm hover:shadow-xl transition-all bg-white">
          <h3 class="text-center text-3xl mt-4 mb-6">Gym</h3>
          <img src="/demo/images/landing/startup.svg" class="w-9/12 mx-auto" />
          <div class="text-center my-6">
            <div class="text-5xl font-bold">$19</div>
            <div class="text-surface-600">per month</div>
          </div>
          <button class="w-full py-3 rounded-lg text-xl mb-6" style="background-color:#ff474c;color:white;">Choose Plan
          </button>
        </div>
      </div>

      <!-- Studio / Enterprise -->
      <div class="col-span-12 lg:col-span-4">
        <div class="p-6 rounded-xl border-2 shadow-sm hover:shadow-xl transition-all bg-white">
          <h3 class="text-center text-3xl mt-4 mb-6">Studio / Enterprise</h3>
          <img src="/demo/images/landing/enterprise.svg" class="w-9/12 mx-auto" />
          <div class="text-center my-6">
            <div class="text-5xl font-bold">$49</div>
            <div class="text-surface-600">per month</div>
          </div>
          <button class="w-full py-3 rounded-lg text-xl mb-6" style="background-color:#ff474c;color:white;">Contact Sales</button>
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
          <h4 class="font-bold text-3xl text-surface-900">HeartApp</h4>
        </div>
        <p class="text-surface-600 text-xl max-w-xs">
          Real-time heart rate monitoring za moderne teretane, studije i fitnes centre.
        </p>
      </div>

      <div class="col-span-6 md:col-span-3">
        <h4 class="font-medium text-2xl mb-4">Company</h4>
        <ul class="text-xl text-surface-700 space-y-2">
          <li>About</li>
          <li>Contact</li>
          <li>Team</li>
          <li>Careers</li>
        </ul>
      </div>

      <div class="col-span-6 md:col-span-3">
        <h4 class="font-medium text-2xl mb-4">Resources</h4>
        <ul class="text-xl text-surface-700 space-y-2">
          <li>Get Started</li>
          <li>Documentation</li>
          <li>Case Studies</li>
          <li>Community</li>
        </ul>
      </div>

      <div class="col-span-12 md:col-span-3">
        <h4 class="font-medium text-2xl mb-4">Legal</h4>
        <ul class="text-xl text-surface-700 space-y-2">
          <li>Privacy Policy</li>
          <li>Terms of Service</li>
          <li>Brand Guidelines</li>
        </ul>
      </div>

    </div>

    <div class="text-center mt-16 text-xl text-surface-600">
      © 2025 HeartApp — All rights reserved.
    </div>
  </footer>
</template>
