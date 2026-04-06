import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Üstteki başlığı gizle
        tabBarStyle: { display: 'none' }, // ALTTAKİ SİYAH BARI KOMPLE GİZLE
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          title: 'Anasayfa',
        }}
      />
      
      {/* Explore sekmesini sistemden gizle */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null, 
        }}
      />
    </Tabs>
  );
} 