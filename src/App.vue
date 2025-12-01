<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

// 你的 Apps Script Web App URL
const API_URL = "/api"

// 禮金列表
const gifts = ref([])

// 新增禮金表單
const newGift = ref({ name: '', amount: '', note: '' })

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
    newGift.value = { name: '', amount: '', note: '' }
    fetchGifts() // 重新抓取資料
  } catch (err) {
    console.error(err)
  }
}

// 初始抓取資料
onMounted(fetchGifts)
</script>

<template>
  <div>
    <h1>Wedding Gift App</h1>

    <!-- 新增禮金表單 -->
    <div>
      <input v-model="newGift.name" placeholder="Name">
      <input v-model="newGift.amount" placeholder="Amount">
      <input v-model="newGift.note" placeholder="Note">
      <button @click="submitGift">Add Gift</button>
    </div>

    <!-- 顯示禮金清單 -->
    <ul>
      <li v-for="(gift, index) in gifts" :key="index">
        {{ gift.join(' | ') }}
      </li>
    </ul>
  </div>
</template>
