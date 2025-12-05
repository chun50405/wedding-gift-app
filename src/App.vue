<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

// 本機 Proxy API
const API_URL = "/api"

// 禮金列表
const gifts = ref([])

// 新增禮金表單
const newGift = ref({ name: '', amount: 0, side: '男方', note: '' })

// 提示訊息
const toast = ref({ show: false, message: '', type: 'success' })

// 編輯狀態
const editingId = ref(null)
const editingGift = ref({})

// 加載狀態
const isSubmitting = ref(false)
const isDeleting = ref({})
const isEditing = ref({})

// 顯示 Toast 提示
const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

// 取得 Google Sheet 資料
const fetchGifts = async () => {
  try {
    const res = await axios.get(API_URL)
    // 過濾掉標題列（第一列）
    // 標準化每列，確保每列為 [name, amount, side, note, date]
    gifts.value = res.data.slice(1).map(row => [
      row[0] ?? '',
      row[1] ?? 0,
      row[2] ?? '男方',
      row[3] ?? '',
      row[4] ?? ''
    ])
  } catch (err) {
    console.error(err)
    showToast('取得資料失敗', 'error')
  }
}

// 新增一筆禮金
const submitGift = async () => {
  if (!newGift.value.name || newGift.value.amount <= 0) {
    showToast('請填寫完整資訊', 'error')
    return
  }

  isSubmitting.value = true
  try {
    await axios.post(API_URL, newGift.value)
    showToast('已新增禮金！', 'success')
    newGift.value = { name: '', amount: 0, side: '男方', note: '' }
    await fetchGifts()
  } catch (err) {
    console.error(err)
    showToast('新增失敗，請稍後重試', 'error')
  } finally {
    isSubmitting.value = false
  }
}

// 開始編輯
const startEdit = (index) => {
  editingId.value = index
  // 使用陣列複製保持欄位位置一致
  editingGift.value = [...gifts.value[index]]
}

// 取消編輯
const cancelEdit = () => {
  editingId.value = null
  editingGift.value = {}
}

// 保存編輯
const saveEdit = async (index) => {
  if (!editingGift.value[0] || editingGift.value[1] <= 0) {
    showToast('請填寫完整資訊', 'error')
    return
  }

  isEditing.value[index] = true
  try {
    // 使用 POST 搭配 action=update（避免伺服器不接受 PUT/DELETE）
    await axios.post(API_URL, {
      action: 'update',
      rowIndex: index + 1,
      name: editingGift.value[0],
      amount: editingGift.value[1],
      side: editingGift.value[2],
      note: editingGift.value[3]
    })
    showToast('已更新禮金！', 'success')
    editingId.value = null
    await fetchGifts()
  } catch (err) {
    console.error(err)
    showToast('更新失敗，請稍後重試', 'error')
  } finally {
    isEditing.value[index] = false
  }
}

// 刪除禮金
const deleteGift = async (index) => {
  if (!confirm('確定要刪除此筆禮金嗎？')) return

  isDeleting.value[index] = true
  try {
    // 使用 POST 搭配 action=delete（避免伺服器不接受 PUT/DELETE）
    await axios.post(API_URL, {
      action: 'delete',
      rowIndex: index + 1
    })
    showToast('已刪除禮金', 'success')
    await fetchGifts()
  } catch (err) {
    console.error(err)
    showToast('刪除失敗，請稍後重試', 'error')
  } finally {
    isDeleting.value[index] = false
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
              <label class="block text-sm font-semibold text-gray-700 mb-2">姓名</label>
              <input
                v-model="newGift.name"
                type="text"
                placeholder="請輸入姓名"
                class="w-full p-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition text-gray-900 placeholder-gray-400"
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">金額</label>
              <input
                v-model.number="newGift.amount"
                type="number"
                placeholder="請輸入金額"
                class="w-full p-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition text-gray-900 placeholder-gray-400"
              />
              <div class="flex gap-2 mt-3">
                <button 
                  @click="addAmount(100)"
                  class="flex-1 bg-pink-100 text-pink-600 font-semibold px-3 py-2 rounded-lg hover:bg-pink-200 transition"
                >
                  +100
                </button>
                <button 
                  @click="addAmount(500)"
                  class="flex-1 bg-pink-100 text-pink-600 font-semibold px-3 py-2 rounded-lg hover:bg-pink-200 transition"
                >
                  +500
                </button>
                <button 
                  @click="addAmount(1000)"
                  class="flex-1 bg-pink-100 text-pink-600 font-semibold px-3 py-2 rounded-lg hover:bg-pink-200 transition"
                >
                  +1000
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">方別</label>
              <div class="flex gap-3">
                <label class="flex items-center cursor-pointer">
                  <input
                    v-model="newGift.side"
                    type="radio"
                    value="男方"
                    class="w-4 h-4 cursor-pointer"
                  />
                  <span class="ml-2 text-gray-700">男方</span>
                </label>
                <label class="flex items-center cursor-pointer">
                  <input
                    v-model="newGift.side"
                    type="radio"
                    value="女方"
                    class="w-4 h-4 cursor-pointer"
                  />
                  <span class="ml-2 text-gray-700">女方</span>
                </label>
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">備註</label>
              <input
                v-model="newGift.note"
                type="text"
                placeholder="請輸入備註（選填）"
                class="w-full p-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition text-gray-900 placeholder-gray-400"
              />
            </div>

            <button
              @click="submitGift"
              :disabled="isSubmitting"
              class="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-400 text-white py-3 rounded-lg transition font-bold text-lg"
            >
              {{ isSubmitting ? '正在新增...' : '新增禮金' }}
            </button>
          </div>
        </div>

        <!-- 禮金清單 -->
        <div class="lg:col-span-2">
          <div class="space-y-4">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">禮金清單</h2>
            
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
                    
                    <td class="px-6 py-4 text-gray-500 text-sm">{{ new Date(gift[4]).toLocaleString('zh-TW') }}</td>
                    
                    <td class="px-6 py-4 text-center space-x-2">
                      <template v-if="editingId === index">
                        <button
                          @click="saveEdit(index)"
                          :disabled="isEditing[index]"
                          class="px-3 py-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded text-sm font-semibold transition"
                        >
                          保存
                        </button>
                        <button
                          @click="cancelEdit"
                          class="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm font-semibold transition"
                        >
                          取消
                        </button>
                      </template>
                      <template v-else>
                        <button
                          @click="startEdit(index)"
                          class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-semibold transition"
                        >
                          編輯
                        </button>
                        <button
                          @click="deleteGift(index)"
                          :disabled="isDeleting[index]"
                          class="px-3 py-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded text-sm font-semibold transition"
                        >
                          {{ isDeleting[index] ? '刪除中...' : '刪除' }}
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
                  <div class="flex gap-2 pt-2">
                    <button
                      @click="saveEdit(index)"
                      :disabled="isEditing[index]"
                      class="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded text-sm font-semibold transition"
                    >
                      保存
                    </button>
                    <button
                      @click="cancelEdit"
                      class="flex-1 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm font-semibold transition"
                    >
                      取消
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
                  <p class="text-gray-400 text-xs mb-4">{{ new Date(gift[4]) }}</p>
                  <div class="flex gap-2">
                    <button
                      @click="startEdit(index)"
                      class="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-semibold transition"
                    >
                      編輯
                    </button>
                    <button
                      @click="deleteGift(index)"
                      :disabled="isDeleting[index]"
                      class="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded text-sm font-semibold transition"
                    >
                      {{ isDeleting[index] ? '刪除中...' : '刪除' }}
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
