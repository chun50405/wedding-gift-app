<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

// 本機 Proxy API
const API_URL = "/api"

// 禮金列表
const gifts = ref([])

// 新增禮金表單
const newGift = ref({ name: '', amount: 0, note: '' })

// 取得 Google Sheet 資料
const fetchGifts = async () => {
  try {
    const res = await axios.get(API_URL)
    gifts.value = res.data
  } catch (err) {
    console.error(err)
  }
}

// 新增一筆禮金
const submitGift = async () => {
  try {
    await axios.post(API_URL, newGift.value)
    alert("已新增禮金！")
    newGift.value = { name: '', amount: 0, note: '' }
    fetchGifts()
  } catch (err) {
    console.error(err)
  }
}

// 快速加額按鈕
const addAmount = (value) => {
  newGift.value.amount = Number(newGift.value.amount) + value
}

// 初始抓取資料
onMounted(fetchGifts)
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center p-6">
    <div class="bg-pink-500 text-white p-4 rounded-lg">
  Tailwind CSS 生效測試
</div>
    <h1 class="text-4xl font-bold text-pink-600 mb-6">Wedding Gift App</h1>

    <!-- 新增禮金表單 -->
    <div class="bg-white p-6 rounded-xl shadow-md w-full max-w-md space-y-4">
      
      <input
        v-model="newGift.name"
        type="text"
        placeholder="Name"
        class="w-full p-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition"
      />

      <div class="flex items-center space-x-2">
        <input
          v-model.number="newGift.amount"
          type="number"
          placeholder="Amount"
          class="bg-black flex-1 p-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition"
        />
        <button class="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition" @click="addAmount(100)">+100</button>
        <button class="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition" @click="addAmount(500)">+500</button>
        <button class="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition" @click="addAmount(1000)">+1000</button>
      </div>

      <input
        v-model="newGift.note"
        type="text"
        placeholder="Note"
        class="w-full p-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition"
      />

      <button
        @click="submitGift"
        class="w-full bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition font-semibold"
      >
        Add Gift
      </button>
    </div>

    <!-- 顯示禮金清單 -->
    <ul class="mt-8 w-full max-w-md space-y-2">
      <li
        v-for="(gift, index) in gifts"
        :key="index"
        class="bg-white p-4 rounded-lg shadow flex justify-between items-center"
      >
        <span>{{ gift[0] }} | {{ gift[1] }} | {{ gift[2] }}</span>
        <span class="text-gray-400 text-sm">{{ new Date(gift[3]).toLocaleString() }}</span>
      </li>
    </ul>
  </div>
</template>
