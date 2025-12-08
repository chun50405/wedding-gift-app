<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

const API_URL = import.meta.env.VITE_API_URL
console.log(API_URL)
// 禮金列表（每筆仍維持陣列格式： [name, amount, side, note, date, rowIndex] ）
const gifts = ref([])

// 新增禮金表單
const newGift = ref({ name: '', amount: 0, side: '男方', note: '' })

// 提示訊息
const toast = ref({ show: false, message: '', type: 'success' })

// 編輯狀態
const editingId = ref(null)
const editingGift = ref([])

// 加載狀態
const isSubmitting = ref(false)
const isDeleting = ref({})
const isEditing = ref({})
const isRefreshing = ref(false)

// 顯示 Toast 提示
const showToast = (msg, type = 'success') => {
  const icon =
    type === 'success' ? '✅ ' :
    type === 'error'   ? '❌ ' :
    type === 'warning' ? '⚠️ ' : ''

  toast.message = icon + msg
  toast.type = type
  toast.show = true

  setTimeout(() => {
    toast.show = false
  }, 2000)
}


// 取得 Google Sheet 資料
const fetchGifts = async () => {
  isRefreshing.value = true
  try {
    const res = await axios.get(API_URL)
    const body = res.data

    if (!Array.isArray(body)) {
      gifts.value = []
      return
    }

    // ✅ 只處理你現在的物件格式 + 最新在最上面
    const sorted = [...body].sort((a, b) => {
      const tA = a.date ? new Date(a.date).getTime() : 0
      const tB = b.date ? new Date(b.date).getTime() : 0
      return tB - tA
    })

    gifts.value = sorted.map(item => ([
      item.name ?? '',
      Number(item.amount ?? 0),
      item.side ?? '男方',
      item.note ?? '',
      item.date ?? '',
      item.rowIndex ?? 0
    ]))

  } catch (err) {
    console.error('fetchGifts error', err)
    showToast('取得資料失敗', 'error')
  } finally {
    isRefreshing.value = false
  }
}


// 新增一筆禮金
const submitGift = async () => {
  if (!newGift.value.name || Number(newGift.value.amount) <= 0) {
    showToast('請填寫完整資訊', 'error')
    return
  }

  isSubmitting.value = true
  try {
    // 明確使用 JSON header，避免 Apps Script 解析成表單格式錯誤
    await axios.post(API_URL, newGift.value, {
      headers: { 'Content-Type': 'application/json' }
    })
    showToast('已新增禮金！', 'success')
    newGift.value = { name: '', amount: 0, side: '男方', note: '' }
    await fetchGifts()
  } catch (err) {
    console.error('submitGift error', err)
    showToast('新增失敗，請稍後重試', 'error')
  } finally {
    isSubmitting.value = false
  }
}

// 開始編輯（複製陣列）
const startEdit = (index) => {
  editingId.value = index
  editingGift.value = [...gifts.value[index]] // 保持陣列格式
}

// 取消編輯
const cancelEdit = () => {
  editingId.value = null
  editingGift.value = {}
}

// 保存編輯
const saveEdit = async (index) => {
  // editingGift: [name, amount, side, note, date, rowIndex]
  if (!editingGift.value[0] || Number(editingGift.value[1]) <= 0) {
    showToast('請填寫完整資訊', 'error')
    return
  }

  const rowIndex = Number(editingGift.value[5] || gifts.value[index]?.[5] || (index + 2))
  isEditing.value[index] = true
  try {
    await axios.post(API_URL, {
      action: 'update',
      rowIndex,
      name: editingGift.value[0],
      amount: Number(editingGift.value[1]),
      side: editingGift.value[2],
      note: editingGift.value[3]
    }, { headers: { 'Content-Type': 'application/json' } })

    showToast('已更新禮金！', 'success')
    editingId.value = null
    await fetchGifts()
  } catch (err) {
    console.error('saveEdit error', err)
    showToast('更新失敗，請稍後重試', 'error')
  } finally {
    isEditing.value[index] = false
  }
}

// 刪除禮金
const deleteGift = async (index) => {
  if (!confirm('確定要刪除此筆禮金嗎？')) return

  const rowIndex = Number(gifts.value[index]?.[5] || (index + 2))
  isDeleting.value[index] = true
  try {
    await axios.post(API_URL, {
      action: 'delete',
      rowIndex
    }, { headers: { 'Content-Type': 'application/json' } })
    showToast('已刪除禮金', 'success')
    await fetchGifts()
  } catch (err) {
    console.error('deleteGift error', err)
    showToast('刪除失敗，請稍後重試', 'error')
  } finally {
    isDeleting.value[index] = false
  }
}

// 快速加額按鈕
const addAmount = (value) => {
  newGift.value.amount = Number(newGift.value.amount) + value
}

onMounted(fetchGifts)
</script>


<template>
  <div class="min-h-screen bg-gradient-to-br from-pink-50 to-red-50">
    <!-- Toast Notification -->
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="toast.show"
        class="fixed top-1/4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-lg shadow-lg text-white font-semibold transition"
        :class="toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
      >
        {{ toast.message }}
      </div>
    </transition>

    <div class="container mx-auto px-4 py-8 max-w-7xl">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-red-600 mb-3">Wedding Gift App</h1>
        <p class="text-gray-600 text-lg">記錄每一份祝福</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- 新增禮金表單 -->
        <div class="lg:col-span-1">
          <div class="bg-white p-8 rounded-2xl shadow-lg sticky top-8 space-y-5">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">新增禮金</h2>
            
            <div>
              <label class="block text-sm font-semibold text-pink-700 mb-2">姓名</label>
              <input
                v-model="newGift.name"
                type="text"
                placeholder="請輸入姓名"
                class="w-full p-3 rounded-lg border border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none transition text-pink-700 placeholder-pink-300 bg-pink-50"
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-pink-700 mb-2">金額</label>
              <input
                v-model.number="newGift.amount"
                type="number"
                placeholder="請輸入金額"
                class="w-full p-3 rounded-lg border border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none transition text-pink-700 placeholder-pink-300 bg-pink-50"
              />
              <div class="flex gap-2 mt-3">
                <button 
                  @click="addAmount(100)"
                  class="flex-1 bg-gradient-to-r from-pink-200 to-red-200 text-pink-700 font-bold px-3 py-2 rounded-full shadow hover:from-pink-300 hover:to-red-300 hover:text-red-700 transition duration-150 focus:outline-none focus:ring-2 focus:ring-pink-200"
                >
                  +100
                </button>
                <button 
                  @click="addAmount(500)"
                  class="flex-1 bg-gradient-to-r from-pink-200 to-red-200 text-pink-700 font-bold px-3 py-2 rounded-full shadow hover:from-pink-300 hover:to-red-300 hover:text-red-700 transition duration-150 focus:outline-none focus:ring-2 focus:ring-pink-200"
                >
                  +500
                </button>
                <button 
                  @click="addAmount(1000)"
                  class="flex-1 bg-gradient-to-r from-pink-200 to-red-200 text-pink-700 font-bold px-3 py-2 rounded-full shadow hover:from-pink-300 hover:to-red-300 hover:text-red-700 transition duration-150 focus:outline-none focus:ring-2 focus:ring-pink-200"
                >
                  +1000
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-pink-700 mb-2">方別</label>
              <div class="flex gap-3">
                <label class="flex items-center cursor-pointer">
                  <input
                    v-model="newGift.side"
                    type="radio"
                    value="男方"
                    class="w-4 h-4 cursor-pointer accent-pink-500"
                  />
                  <span class="ml-2 text-pink-700 font-semibold">男方</span>
                </label>
                <label class="flex items-center cursor-pointer">
                  <input
                    v-model="newGift.side"
                    type="radio"
                    value="女方"
                    class="w-4 h-4 cursor-pointer accent-red-400"
                  />
                  <span class="ml-2 text-red-500 font-semibold">女方</span>
                </label>
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-pink-700 mb-2">備註</label>
              <input
                v-model="newGift.note"
                type="text"
                placeholder="請輸入備註（選填）"
                class="w-full p-3 rounded-lg border border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none transition text-pink-700 placeholder-pink-300 bg-pink-50"
              />
            </div>

            <button
              @click="submitGift"
              :disabled="isSubmitting"
              class="w-full bg-gradient-to-r from-pink-400 to-red-400 hover:from-pink-500 hover:to-red-500 disabled:from-gray-300 disabled:to-gray-300 text-white py-3 rounded-full transition font-bold text-lg shadow-lg"
            >
              {{ isSubmitting ? '正在新增...' : '新增禮金' }}
            </button>
          </div>
        </div>

        <!-- 禮金清單 -->
        <div class="lg:col-span-2">
          <div class="space-y-4">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-2xl font-bold text-gray-800">禮金清單</h2>

              <button
                @click="fetchGifts"
                :disabled="isRefreshing"
                class="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:bg-gray-300 text-white font-semibold transition"
              >
                <span v-if="isRefreshing" class="flex items-center gap-2">
                  <span class="animate-spin">🔄</span>
                    同步中…
                  </span>
                <span v-else>🔄 同步</span>

              </button>
            </div>

            <div v-if="gifts.length === 0" class="bg-white p-12 rounded-2xl shadow-lg text-center">
              <p class="text-gray-400 text-lg">目前還沒有禮金紀錄</p>
            </div>

            <!-- 表格顯示 (Desktop) -->
            <div class="hidden md:block bg-white rounded-2xl shadow-lg overflow-hidden">
              <table class="w-full">
                <thead class="bg-gradient-to-r from-pink-500 to-red-500 text-white">
                  <tr>
                    <th class="px-6 py-4 text-left font-semibold">姓名</th>
                    <th class="px-6 py-4 text-left font-semibold">金額</th>
                    <th class="px-6 py-4 text-left font-semibold">方別</th>
                    <th class="px-6 py-4 text-left font-semibold">備註</th>
                    <th class="px-6 py-4 text-left font-semibold">時間</th>
                    <th class="px-6 py-4 text-center font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr v-for="(gift, index) in gifts" :key="index" class="hover:bg-gray-50 transition">
                    <td v-if="editingId === index" class="px-6 py-4">
                      <input v-model="editingGift[0]" type="text" class="w-full p-2 border border-gray-300 rounded text-gray-900" />
                    </td>
                    <td v-else class="px-6 py-4 font-medium text-gray-800">{{ gift[0] }}</td>
                    
                    <td v-if="editingId === index" class="px-6 py-4">
                      <input v-model.number="editingGift[1]" type="number" class="w-full p-2 border border-gray-300 rounded text-gray-900" />
                    </td>
                    <td v-else class="px-6 py-4 text-pink-600 font-semibold">NT$ {{ gift[1].toLocaleString() }}</td>
                    
                    <td v-if="editingId === index" class="px-6 py-4">
                      <select v-model="editingGift[2]" class="w-full p-2 border border-gray-300 rounded text-gray-900">
                        <option>男方</option>
                        <option>女方</option>
                      </select>
                    </td>
                    <td v-else class="px-6 py-4">
                      <span :class="gift[2] === '男方' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'" class="px-3 py-1 rounded-full text-sm font-semibold">
                        {{ gift[2] }}
                      </span>
                    </td>
                    
                    <td v-if="editingId === index" class="px-6 py-4">
                      <input v-model="editingGift[3]" type="text" class="w-full p-2 border border-gray-300 rounded text-gray-900" />
                    </td>
                    <td v-else class="px-6 py-4 text-gray-600">{{ gift[3] }}</td>
                    
                    <td class="px-6 py-4 text-gray-500 text-sm">{{ dayjs(gift[4]).format('YYYY/MM/DD HH:mm:ss') }}</td>
                    
                    <td class="px-6 py-4 text-center space-x-3 text-lg">
                      <template v-if="editingId === index">
                        <button
                          @click="saveEdit(index)"
                          :disabled="isEditing[index]"
                          class="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-r from-green-200 to-green-400 text-green-700 font-bold shadow hover:from-green-300 hover:to-green-500 hover:text-green-800 disabled:bg-gray-100 disabled:text-gray-400 transition duration-150 focus:outline-none focus:ring-2 focus:ring-green-200"
                          title="保存"
                        >
                          <span class="text-xl">✅</span>
                        </button>

                        <button
                          @click="cancelEdit"
                          class="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 font-bold shadow hover:from-gray-300 hover:to-gray-400 hover:text-gray-900 transition duration-150 focus:outline-none focus:ring-2 focus:ring-gray-200"
                          title="取消"
                        >
                          <span class="text-xl">❌</span>
                        </button>
                      </template>

                      <template v-else>
                        <button
                          @click="startEdit(index)"
                          class="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-r from-pink-200 to-red-200 text-pink-700 font-bold shadow hover:from-pink-300 hover:to-red-300 hover:text-red-700 transition duration-150 focus:outline-none focus:ring-2 focus:ring-pink-200"
                          title="編輯"
                        >
                          <span class="text-xl">✏️</span>
                        </button>

                        <button
                          @click="deleteGift(index)"
                          :disabled="isDeleting[index]"
                          class="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-r from-red-200 to-pink-200 text-red-700 font-bold shadow hover:from-red-300 hover:to-pink-300 hover:text-pink-700 disabled:bg-gray-100 disabled:text-gray-400 transition duration-150 focus:outline-none focus:ring-2 focus:ring-red-200"
                          title="刪除"
                        >
                          <span v-if="isDeleting[index]" class="text-base animate-pulse">⏳</span>
                          <span v-else class="text-xl">🗑️</span>
                        </button>
                      </template>
                    </td>

                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 卡片顯示 (Mobile) -->
            <div class="md:hidden space-y-3">
              <div
                v-for="(gift, index) in gifts"
                :key="index"
                class="bg-white p-5 rounded-xl shadow-md border-l-4 border-pink-500"
              >
                <div v-if="editingId === index" class="space-y-3">
                  <div>
                    <label class="text-sm text-gray-600">姓名</label>
                    <input v-model="editingGift[0]" type="text" class="w-full p-2 border border-gray-300 rounded text-gray-900 text-sm" />
                  </div>
                  <div>
                    <label class="text-sm text-gray-600">金額</label>
                    <input v-model.number="editingGift[1]" type="number" class="w-full p-2 border border-gray-300 rounded text-gray-900 text-sm" />
                  </div>
                  <div>
                    <label class="text-sm text-gray-600">方別</label>
                    <select v-model="editingGift[2]" class="w-full p-2 border border-gray-300 rounded text-gray-900 text-sm">
                      <option>男方</option>
                      <option>女方</option>
                    </select>
                  </div>
                  <div>
                    <label class="text-sm text-gray-600">備註</label>
                    <input v-model="editingGift[3]" type="text" class="w-full p-2 border border-gray-300 rounded text-gray-900 text-sm" />
                  </div>
                  <div class="flex gap-4 pt-2 justify-end text-xl">
                    <button
                      @click="saveEdit(index)"
                      :disabled="isEditing[index]"
                      class="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-r from-green-200 to-green-400 text-green-700 font-bold shadow hover:from-green-300 hover:to-green-500 hover:text-green-800 disabled:bg-gray-100 disabled:text-gray-400 transition duration-150 focus:outline-none focus:ring-2 focus:ring-green-200"
                      title="保存"
                    >
                      <span class="text-xl">✅</span>
                    </button>
                    <button
                      @click="cancelEdit"
                      class="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 font-bold shadow hover:from-gray-300 hover:to-gray-400 hover:text-gray-900 transition duration-150 focus:outline-none focus:ring-2 focus:ring-gray-200"
                      title="取消"
                    >
                      <span class="text-xl">❌</span>
                    </button>
                  </div>
                </div>
                <div v-else>
                  <div class="flex justify-between items-start mb-3">
                    <div>
                      <p class="font-bold text-lg text-gray-800">{{ gift[0] }}</p>
                      <p class="text-pink-600 font-bold text-xl">NT$ {{ gift[1] }}</p>
                    </div>
                    <span :class="gift[2] === '男方' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'" class="px-3 py-1 rounded-full text-xs font-semibold">
                      {{ gift[2] }}
                    </span>
                  </div>
                  <p v-if="gift[3]" class="text-gray-600 text-sm mb-2">{{ gift[3] }}</p>
                  <p class="text-gray-400 text-xs mb-4">{{ new Date(gift[4]).toLocaleString('zh-TW', { hour12: false }) }}</p>
                  <div class="flex gap-4 text-xl justify-end">
                    <button
                      @click="startEdit(index)"
                      class="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-r from-pink-200 to-red-200 text-pink-700 font-bold shadow hover:from-pink-300 hover:to-red-300 hover:text-red-700 transition duration-150 focus:outline-none focus:ring-2 focus:ring-pink-200"
                      title="編輯"
                    >
                      <span class="text-xl">✏️</span>
                    </button>
                    <button
                      @click="deleteGift(index)"
                      :disabled="isDeleting[index]"
                      class="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-r from-red-200 to-pink-200 text-red-700 font-bold shadow hover:from-red-300 hover:to-pink-300 hover:text-pink-700 disabled:bg-gray-100 disabled:text-gray-400 transition duration-150 focus:outline-none focus:ring-2 focus:ring-red-200"
                      title="刪除"
                    >
                      <span v-if="isDeleting[index]" class="text-base animate-pulse">⏳</span>
                      <span v-else class="text-xl">🗑️</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
