Vue.component('card', {
    props: ['card'],
    template: `
    <div class="card">
      <h3>{{ card.title }}</h3>
      <ul>
        <li v-for="(item, index) in card.items" :key="index">
          <input type="checkbox" v-model="item.completed" @change="$emit('update')">
          <span :class="{ completed: item.completed }">{{ item.text }}</span>
        </li>
      </ul>
      <p v-if="card.completedAt">Завершено: {{ card.completedAt }}</p>
    </div>
  `
});

new Vue({
    el: '#app',
    data: {
        columns: [
            {id: 1, cards: []},
            {id: 2, cards: []},
            {id: 3, cards: []}
        ],
        showForm: false,
        formColumnId: null,
        newCardTitle: '',
        newCardItems: ['', '', '']
    },
    methods: {
        openForm(columnId) {
            this.formColumnId = columnId;
            this.showForm = true;
        },
        closeForm() {
            this.showForm = false;
            this.newCardTitle = '';
            this.newCardItems = ['', '', ''];
        },
        addItem() {
            this.newCardItems.push('');
        },
        removeItem(index) {
            this.newCardItems.splice(index, 1);
        },
        submitForm() {
            const column = this.columns.find(col => col.id === this.formColumnId);
            if (this.newCardTitle && this.newCardItems.every(item => item.trim())) {
                column.cards.push({
                    id: Date.now(),
                    title: this.newCardTitle,
                    items: this.newCardItems.map(text => ({ text, completed: false })),
                    completedAt: null
                });
                this.saveData();
                this.closeForm();
            } else {
                alert('Заполните все поля!');
            }
        },
    }
})