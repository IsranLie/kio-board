<template>
  <ion-app>
    <ion-router-outlet />
    <Toast />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import Toast from '@/components/ui/Toast.vue';
</script>
