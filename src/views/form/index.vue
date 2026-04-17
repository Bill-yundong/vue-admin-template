<template>
  <div class="app-container">
    <el-form ref="form" :model="form" :rules="formRules" label-width="120px">
      <el-form-item label="Activity name" prop="name">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="Activity zone" prop="region">
        <el-select v-model="form.region" placeholder="please select your zone">
          <el-option label="Zone one" value="shanghai" />
          <el-option label="Zone two" value="beijing" />
        </el-select>
      </el-form-item>
      <el-form-item label="Activity time" prop="timeRange">
        <el-col :span="11">
          <el-date-picker v-model="form.date1" type="date" placeholder="Pick a date" style="width: 100%;" />
        </el-col>
        <el-col :span="2" class="line">-</el-col>
        <el-col :span="11">
          <el-time-picker v-model="form.date2" type="fixed-time" placeholder="Pick a time" style="width: 100%;" />
        </el-col>
      </el-form-item>
      <el-form-item label="Instant delivery" prop="delivery">
        <el-switch v-model="form.delivery" />
      </el-form-item>
      <el-form-item label="Activity type" prop="type">
        <el-checkbox-group v-model="form.type">
          <el-checkbox label="Online activities" name="type" />
          <el-checkbox label="Promotion activities" name="type" />
          <el-checkbox label="Offline activities" name="type" />
          <el-checkbox label="Simple brand exposure" name="type" />
        </el-checkbox-group>
      </el-form-item>
      <el-form-item label="Resources" prop="resource">
        <el-radio-group v-model="form.resource">
          <el-radio label="Sponsor" />
          <el-radio label="Venue" />
        </el-radio-group>
      </el-form-item>
      <el-form-item label="Activity form" prop="desc">
        <el-input v-model="form.desc" type="textarea" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">Create</el-button>
        <el-button @click="onCancel">Cancel</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      form: {
        name: '',
        region: '',
        date1: '',
        date2: '',
        delivery: false,
        type: [],
        resource: '',
        desc: ''
      },
      formRules: {
        name: [
          { required: true, message: 'Please input activity name', trigger: 'blur' },
          { min: 3, max: 50, message: 'Length should be 3 to 50', trigger: 'blur' }
        ],
        region: [
          { required: true, message: 'Please select activity zone', trigger: 'change' }
        ],
        type: [
          { type: 'array', required: true, message: 'Please select at least one type', trigger: 'change' }
        ],
        resource: [
          { required: true, message: 'Please select resource', trigger: 'change' }
        ],
        desc: [
          { required: true, message: 'Please input activity form', trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    onSubmit() {
      this.$refs.form.validate((valid) => {
        if (valid) {
          this.processAndSubmit()
        } else {
          this.$message.error('Please fill in all required fields')
          return false
        }
      })
    },
    processAndSubmit() {
      // 步骤1: 数据收集
      const rawData = {
        name: this.form.name,
        region: this.form.region,
        date1: this.form.date1,
        date2: this.form.date2,
        delivery: this.form.delivery,
        type: this.form.type,
        resource: this.form.resource,
        desc: this.form.desc
      }

      // 步骤2: 数据转换 - BUG在这里！
      const transformedData = this.transformData(rawData)

      // 步骤3: 数据验证
      if (this.validateTransformedData(transformedData)) {
        // 步骤4: 提交数据
        this.submitToServer(transformedData)
      }
    },
    transformData(data) {
      // 数据字段映射转换
      const mapping = {
        activityName: 'name',
        activityZone: 'region',
        activityTime: 'date1',
        activityDate: 'date2',
        instantDelivery: 'delivery',
        activityType: 'type',
        resources: 'resource',
        activityForm: 'desc'
      }

      const result = {}
      for (const [key, value] of Object.entries(mapping)) {
        // 错误：使用 mapping 的 value 作为 key 去取 data 的值
        result[key] = data[value]
      }

      // 步骤5: 数据格式化
      result.activityTime = this.formatDateTime(result.activityTime)
      result.activityDate = this.formatDateTime(result.activityDate)

      return result
    },
    formatDateTime(date) {
      if (!date) return ''
      if (typeof date === 'string') return date
      if (date instanceof Date) {
        return date.toISOString()
      }
      return String(date)
    },
    validateTransformedData(data) {
      // 验证转换后的数据
      const requiredFields = ['activityName', 'activityZone', 'activityType', 'resources']
      for (const field of requiredFields) {
        if (!data[field] || (Array.isArray(data[field]) && data[field].length === 0)) {
          this.$message.error(`Field ${field} is required`)
          return false
        }
      }
      return true
    },
    submitToServer(data) {
      // 模拟提交到服务器
      console.log('Submitting data to server:', data)

      // 构建最终的提交格式
      const finalData = {
        ...data,
        submitTime: new Date().toISOString(),
        version: '1.0'
      }

      console.log('Final submit data:', finalData)
      this.$message.success('Form submitted successfully!')

      // 显示提交的数据详情
      this.showSubmitDetails(finalData)
    },
    showSubmitDetails(data) {
      console.group('Form Submission Details')
      console.log('Activity Name:', data.activityName)
      console.log('Activity Zone:', data.activityZone)
      console.log('Activity Time:', data.activityTime)
      console.log('Activity Date:', data.activityDate)
      console.log('Instant Delivery:', data.instantDelivery)
      console.log('Activity Type:', data.activityType)
      console.log('Resources:', data.resources)
      console.log('Activity Form:', data.activityForm)
      console.groupEnd()
    },
    onCancel() {
      this.$confirm('Are you sure to cancel? All data will be lost.', 'Warning', {
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }).then(() => {
        this.resetForm()
        this.$message({
          message: 'Form cancelled!',
          type: 'warning'
        })
      }).catch(() => {
        // 用户取消操作
      })
    },
    resetForm() {
      this.$refs.form.resetFields()
    }
  }
}
</script>

<style scoped>
.line{
  text-align: center;
}
</style>
