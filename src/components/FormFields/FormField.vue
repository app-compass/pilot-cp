<template lang="pug">
div
  span(
    :is="Components[field.type]",
    :pointer="field.name",
    :data="value",
    :value="value",
    :source="field.source",
    :errors="field.errors",
    :label="field.label"
    @input="set"
  )
  fieldset(v-if="field.fields.length")
    FormField(v-for="(sub, index) in field.fields", :key="index", :field="sub", :value="value")
</template>

<script>
import Components from 'components/FormFields'

export default {
  name: 'FormField',
  props: ['field', 'value'],
  data () {
    return {
      Components
    }
  },
  methods: {
    set (payload) {
      this.$emit('set', payload)
    }
  }
}
</script>

<style lang="sass" scoped>
fieldset
  margin: 1rem
  background: rgba(240, 240, 240, 0.4)
  padding: 1rem !important
  border: 1px solid #ddd
</style>
