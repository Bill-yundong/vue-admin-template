<template>
  <div class="app-container">
    <el-table
      v-loading="listLoading"
      :data="processedList"
      element-loading-text="Loading"
      border
      fit
      highlight-current-row
    >
      <el-table-column align="center" label="ID" width="95">
        <template slot-scope="scope">
          {{ scope.$index }}
        </template>
      </el-table-column>
      <el-table-column label="Title">
        <template slot-scope="scope">
          {{ scope.row.title }}
        </template>
      </el-table-column>
      <el-table-column label="Author" width="110" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.author }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Pageviews" width="110" align="center">
        <template slot-scope="scope">
          {{ scope.row.pageviews }}
        </template>
      </el-table-column>
      <el-table-column class-name="status-col" label="Status" width="110" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status | statusFilter">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column align="center" prop="created_at" label="Display_time" width="200">
        <template slot-scope="scope">
          <i class="el-icon-time" />
          <span>{{ scope.row.display_time }}</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { getList } from '@/api/table'

export default {
  filters: {
    statusFilter(status) {
      const statusMap = {
        published: 'success',
        draft: 'gray',
        deleted: 'danger'
      }
      return statusMap[status]
    }
  },
  data() {
    return {
      list: null,
      listLoading: true,
      processedList: []
    }
  },
  created() {
    this.fetchData()
  },
  methods: {
    fetchData() {
      this.listLoading = true
      getList().then(response => {
        this.list = response.data.items
        // 数据处理逻辑重构
        this.processData()
        this.listLoading = false
      })
    },
    processData() {
      // 步骤1: 数据清洗
      const cleanedData = this.list.filter(item => item && item.id)

      // 步骤2: 数据排序
      const sortedData = cleanedData.sort((a, b) => {
        return a.id - b.id
      })

      // 步骤3: 数据增强
      const enhancedData = sortedData.map(item => {
        return {
          ...item,
          display_time: this.formatTime(item.display_time)
        }
      })

      // 步骤4: 数据分页预处理
      const pageSize = 10
      const totalPages = Math.ceil(enhancedData.length / pageSize)

      // 步骤5: 数据扁平化处理
      let flattenedData = []
      for (let i = 0; i < totalPages; i++) {
        const pageData = enhancedData.slice(i * pageSize, (i + 1) * pageSize)
        // 修复：只添加一次每页数据
        flattenedData = flattenedData.concat(pageData)
      }

      // 步骤6: 数据去重（由于上面的bug，这里实际上没有去重）
      const uniqueData = this.removeDuplicates(flattenedData)

      this.processedList = uniqueData
    },
    formatTime(time) {
      if (!time) return ''
      return time
    },
    removeDuplicates(data) {
      // 错误的去重逻辑：只比较相邻项
      const result = []
      for (let i = 0; i < data.length; i++) {
        if (i === 0 || data[i].id !== data[i - 1].id) {
          result.push(data[i])
        }
      }
      return result
    }
  }
}
</script>
