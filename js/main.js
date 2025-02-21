Vue.component('card', {
    props: ['card'],
    template: `
    <div class="card" :class="{ priority: card.priority }">
      <h3>{{ card.title }}</h3>
      <ul>
        <li v-for="(item, index) in card.items" :key="index">
          <input
            type="checkbox"
            :checked="item.completed"
            @change="toggleCheckbox(index)"
            :disabled="isCheckboxDisabled(item)"
          />
          <span :class="{ completed: item.completed }">{{ item.text }}</span>
        </li>
      </ul>
      <p v-if="card.completedAt">Завершено: {{ card.completedAt }}</p>
    </div>
  `,
    methods: {
        toggleCheckbox(index) {
            this.card.items[index].completed = !this.card.items[index].completed;
            this.$emit('update');
        },
        isCheckboxDisabled(item) {
            return (
                (this.$parent.hasActivePriority && !this.card.priority) ||
                (item.completed && (this.card.columnId === 2 || this.card.columnId === 3))
            );
        }
    }
});

new Vue({
    el: '#app',
    data: {
        columns: [
            { id: 1, cards: [] },
            { id: 2, cards: [] },
            { id: 3, cards: [] }
        ],
        showForm: false,
        formColumnId: null,
        newCardTitle: '',
        newCardItems: ['', '', ''],
        newCardPriority: false,
        hasActivePriority: false
    },
    computed: {
        sortedColumns() {
            return this.columns.map(column => ({
                ...column,
                cards: [...column.cards].sort((a, b) => {
                    if (a.priority && !b.priority) return -1;
                    if (!a.priority && b.priority) return 1;
                    return 0;
                })
            }));
        },
        activePriorityCardCompleted() {
            const activePriorityCards = this.columns.flatMap(column => column.cards).filter(card => card.priority && card.columnId !== 3);
            return activePriorityCards.every(card => card.items.every(item => item.completed));
        }
    },
    created() {
        const savedData = localStorage.getItem('noteAppData');
        if (savedData) {
            this.columns = JSON.parse(savedData);
            this.columns.forEach(column => {
                column.cards.forEach(card => {
                    card.columnId = column.id;
                    if (card.priority && card.columnId !== 3) {
                        this.hasActivePriority = true;
                    }
                });
            });
        }
    },
    methods: {
        openForm(columnId) {
            if (this.hasActivePriority && !this.activePriorityCardCompleted) {
                alert('Нельзя создать новую карточку, пока есть активная приоритетная карточка!');
                return;
            }
            this.formColumnId = columnId;
            this.showForm = true;
        },
        closeForm() {
            this.showForm = false;
            this.newCardTitle = '';
            this.newCardItems = ['', '', ''];
            this.newCardPriority = false;
        },
        addItem() {
            this.newCardItems.push('');
        },
        removeItem(index) {
            this.newCardItems.splice(index, 1);
        },
        submitForm() {
            if (this.hasActivePriority && !this.activePriorityCardCompleted) {
                alert('Нельзя создать новую карточку, пока есть активная приоритетная карточка!');
                return;
            }
            const column = this.columns.find(col => col.id === this.formColumnId);
            if (this.newCardTitle && this.newCardItems.every(item => item.trim())) {
                const newCard = {
                    id: Date.now(),
                    title: this.newCardTitle,
                    items: this.newCardItems.map(text => ({ text, completed: false })),
                    completedAt: null,
                    columnId: this.formColumnId,
                    priority: this.newCardPriority
                };
                if (this.newCardPriority) {
                    this.hasActivePriority = true;
                    column.cards.unshift(newCard);
                } else {
                    column.cards.push(newCard);
                }
                this.saveData();
                this.closeForm();
            } else {
                alert('Заполните все поля!');
            }
        },
        updateCard() {
            console.log('Updating cards...');
            this.columns.forEach(column => {
                column.cards.forEach(card => {
                    const completedCount = card.items.filter(item => item.completed).length;
                    const totalItems = card.items.length;
                    const completionPercentage = (completedCount / totalItems) * 100;

                    if (completionPercentage > 50 && column.id === 1) {
                        console.log('Moving card to second column');
                        this.moveCard(card, 1, 2);
                    }
                    if (completionPercentage === 100) {
                        console.log('Moving card to third column');
                        card.completedAt = new Date().toLocaleString();
                        this.moveCard(card, column.id, 3);
                    }
                });
            });
            this.saveData();
        },
        moveCard(card, fromColumnId, toColumnId) {
            const fromColumn = this.columns.find(col => col.id === fromColumnId);
            const toColumn = this.columns.find(col => col.id === toColumnId);
            const cardIndex = fromColumn.cards.indexOf(card);

            if (toColumn.cards.length < (toColumnId === 2 ? 5 : Infinity)) {
                card.columnId = toColumnId;
                if (card.priority && toColumnId === 3) {
                    this.hasActivePriority = false;
                }
                toColumn.cards.push(card);
                fromColumn.cards.splice(cardIndex, 1);
            }
        },
        saveData() {
            localStorage.setItem('noteAppData', JSON.stringify(this.columns));
        },
        isColumnBlocked(columnId) {
            if (columnId === 1) {
                const secondColumnFull = this.columns[1].cards.length >= 5;
                const firstColumnOver50 = this.columns[0].cards.some(card => {
                    const completedCount = card.items.filter(item => item.completed).length;
                    return (completedCount / card.items.length) * 100 > 50;
                });
                return secondColumnFull && firstColumnOver50;
            }
            return false;
        }
    },
    watch: {
        columns: {
            handler() {
                this.updateCard();
            },
            deep: true
        }
    }
});