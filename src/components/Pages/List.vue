<template lang="pug">
  div.row
    div.xsmall-12.columns(v-if="!form && !loading")
      .hero.is-bold.is-danger
        .container
          .hero-body
            .container
              h1.title Missing List View Form
              h2.subtitle  List Form are build using the
                strong  ResourceBuilder,
                |  please provide one.
    div.xsmall-12.columns(v-else)
      div.page-header
        div.row
          div.xsmall-8.columns
            h1.page-title
              | {{ $route.params.sub || $route.params.model }}
          div.xsmall-4.columns.text-right
        div(v-if="can.has('create') && CreateTypes[create_type]", :is="CreateTypes[create_type]")

      div.data-actions-container
        div.data-actions
          form.data-actions-bulk
            div.select
              select
                option(value="") Bulk Actions
                option(value="delete") Delete
                option(value="edit") Edit
              span.icon-select
            button.btn-secondary(type="submit") Update
          div.data-actions-filters-toggle
            a.data-actions-filters-trigger(v-on:click="filter_results_toggle = !filter_results_toggle")
              span.icon-filters
              span.data-actions-filters-label Filter Results
          div.data-actions-view(v-if="view_types.length > 1")
            a.data-list-view(
              v-for="view_type in view_types",
              @click="list_layout = view_type",
              :class="{'is-active': view_type == list_layout}"
            )
              span.icon(:class="'icon-' + view_type.toLowerCase()")
          form.data-actions-search
            div.search-input
              span.icon-search
              input(type="search", placeholder="Search")
        div.data-actions-filters(:class="{'is-active': filter_results_toggle === true}")
          form
            div.row
              div.xsmall-6.columns
                label(for="") Label
                input(type="text")
              div.xsmall-6.columns
                label(for="") Label
                input(type="text")
            div.row
              div.xsmall-12 columns
                button.btn-primary Apply Filters
                a.data-actions-filters-clear Remove Filters

      div.view-container
        div.view-loading(v-if="loading")
          img(src="~assets/images/content/loading.svg")
        Pagination(:p="pagination", :disabled="loading", v-if="pagination.last_page > 1", @page="page")
        section(
          v-if="list_layout && list_layout + 'List'",
          :is="list_layout + 'List'",
          :loading="loading",
          :search="search",
          :sorters="sorters",
          :edit="edit",
          :collection="collection",
          :selectable="selectable",
          :forms="{form: form, edit: edit}",
          @sort="sort",
          @search="doSearch"
        )
        div.view-no-results(v-if="!collection.length") No Results Found
        Pagination(:p="pagination", :disabled="loading", v-if="pagination.last_page > 1", @page="page")
</template>
<script>
import _ from 'lodash'
import api from '../../api'
import swal from 'sweetalert'
import Pagination from 'components/Global/Pagination'
import TableList from 'components/ListTypes/TableList'
import MultiSelectList from 'components/ListTypes/MultiSelectList'
import CardList from 'components/ListTypes/CardList'
import CreateTypes from 'components/CreateTypes'
import RouteHandling from 'Mixins/RouteHandling'

export default {
  name: 'ListView',
  mixins: [RouteHandling],
  components: { Pagination, TableList, MultiSelectList, CardList },
  data() {
    return {
      edit: [],
      form: undefined,
      list_layout: undefined,
      view_types: [],
      create_type: undefined,
      update_type: undefined,
      // @TODO: Owned is very specifict to a type of view (MultiSelectList). we need to clean up how the data is passed down to he view types.
      // true, this would be solved by moving single/multi (edit/list) states into vuex modules, every view would know what to expect in there -f
      owned: [],
      collection: {},
      search: {},
      sorters: {},
      loading: true,
      filter_results_toggle: false,
      pagination: { current_page: 1, surrounded: 3, per_page: 25 },
      can: this.$store.getters.abilities,
      CreateTypes
    }
  },
  watch: {
    $route(to, from) {
      this.search = {}
      if (to.path === from.path) {
        return
      }
      this.reset()
      if (this.pagination.current_page === 1) {
        this.update()
      } else {
        this.pagination.current_page = 1
      }
    }
  },
  created() {
    this.update()
  },
  methods: {
    applyFilter: _.debounce(function() {
      if (this.pagination.current_page > 1) {
        this.pagination.current_page = 1
      } else {
        this.update()
      }
    }, 500),
    reset() {
      this.loading = true
      this.sorters = {}
      this.search = {}
      this.list_layout = null
      this.create_type = null
      this.update_type = null
    },
    update() {
      let vm = this
      vm.loading = true
      api
        .get('/api' + vm.$route.path, {
          params: {
            page: vm.pagination.current_page,
            per_page: vm.pagination.per_page,
            search: vm.search,
            sorters: vm.sorters
          }
        })
        .then(
          response => {
            // Update navigation
            this.$store.dispatch('UPDATE_NAV', response.data.navigation || {})
            vm.loading = false
            if (!response.data.form) {
              vm.form = undefined
              return
            }
            vm.pagination = response.data.pagination
            vm.can.set(response.data.abilities)
            vm.collection = response.data.data
            Object.assign(vm, _.omit(response.data, ['data', 'abilities']))

            // default view on load is always the first.
            if (!vm.list_layout) {
              vm.list_layout = vm.view_types[0]
            }
            Object.freeze(vm.can)
          },
          response => {
            vm.loading = false
            // if (!Auth.user.authenticated) {
            // return
            // }
            swal('Error!', response.data.errors, 'error')
          }
        )
    },
    remove(id) {
      swal(
        {
          title: 'Are you sure?',
          text: 'You will not be able to recover this',
          type: 'warning',
          showCancelButton: true,
          closeOnConfirm: false
        },
        () => {
          api
            .destroy('/api/' + this.$route.path.slice(1) + '/' + id)
            .then(response => {
              swal(
                {
                  title: 'Success',
                  text: response.data.message,
                  type: 'success'
                },
                () => {
                  return this.update()
                }
              )
            })
            .catch(response => {
              swal('Error!', response.data.message, 'error')
            })
        }
      )
    },
    sort(sorters) {
      this.sorters = sorters
      this.update()
    },
    doSearch(search) {
      this.search = search
      this.applyFilter()
    },
    page(page) {
      this.pagination.current_page = page
      this.update()
    }
  }
}
</script>
