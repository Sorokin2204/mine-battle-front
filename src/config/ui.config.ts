/**
 * Единая точка настройки интерфейса.
 *
 * Меняйте здесь подписи, сообщения и пути к изображениям. Компоненты не
 * должны содержать пользовательские тексты или пути к графике напрямую.
 */
/**
 * Единая точка настройки интерфейса.
 *
 * Меняйте здесь подписи, сообщения и пути к изображениям. Компоненты не
 * должны содержать пользовательские тексты или пути к графике напрямую.
 */
export const uiConfig = {
  icons: {
    bomb: '/money.png',
    attack: '/search-1.png',
    autoMatch: '/search-1.png',
    defense: '/money.png',
    money: '/money.png',
    controller: '/controller.png',
    radar: '/radar3.png',
    scanner: '/scanner.png',
    attempt: '/search-1.png',
    win: '/win.png',
    lose: '/down.png',
    completed: '/check.png',
    history: '/history3.png',
  },

  common: {
    player: 'Игрок',
    defender: 'Прячущий',
    attacker: 'Искатель',
    waiting: 'Ожидание',
    bet: 'Ставка',
    winnings: 'Выигрыш',
    loss: 'Проигрыш',
    victory: 'Победа',
    defeat: 'Поражение',
    refund: 'Возврат',
    completed: 'Завершена',
    expired: 'Истекла',
    waitingForAttack: 'Ожидание поиска',
    attackInProgress: 'Идет поиск',
    cancel: 'Отмена',
    close: 'Закрыть',
    place: 'Спрятать',
    loading: 'Загрузка…',
    currency: '⭐',
  },

  difficulty: {
    EASY: {
      label: 'Легкий',
      description: '3×3, 2 бомбы',
    },
    MEDIUM: {
      label: 'Средний',
      description: '4×4, 1 бомба',
    },
    HARD: {
      label: 'Сложный',
      description: '5×5, 3 бомбы',
    },
  },

  header: {
    logout: 'Выйти',
    devLogin: 'Dev Login',
  },

  navigation: {
    mainLabel: 'Основная навигация',
    closeMenu: 'Закрыть меню действий',
    openMenu: 'Открыть меню действий',
    myGames: 'Мои игры',
    activeGames: (count: number) => `Активных игр: ${count}`,

    items: {
      home: 'Главная',
      games: 'Тайники',
      leaders: 'Лидеры',
    },

    actions: {
      attack: 'Искать',
      autoMatch: 'Автопоиск',
      createDefense: 'Спрятать',
    },
  },

  home: {
    attackTitle: 'Искать',
    attackDescription: 'Выбери тайник и найди спрятанное',

    defenseTitle: 'Спрятать',
    defenseDescription: 'Спрячь предметы и поставь ставку',

    howToPlay: 'Как играть?',

    steps: ['Создай тайник: поставь ставку и спрячь предметы на поле', 'Или выбери чужой тайник и попробуй найти спрятанное', 'Используй сканер и радар для поиска', 'Найди всё спрятанное — выиграй ставку!'],
  },

  games: {
    title: 'Тайники',

    tabs: {
      all: 'Все',
      waiting: 'Ждут поиска',
      attacking: 'Идет поиск',
    },

    status: 'Статус',
    sorting: 'Сортировка',
    descending: 'По убыванию',
    ascending: 'По возрастанию',
    bet: 'Ставка',
    from: 'От',
    to: 'До',
    resetFilters: 'Сбросить фильтры',

    emptyTitle: 'Нет доступных тайников',
    emptyHint: 'Создайте первый тайник!',
    createDefense: 'Спрятать',
  },

  myGames: {
    pages: {
      all: {
        title: 'Мои игры',
        icon: '/controller.png',
      },
      attacks: {
        title: 'Мои поиски',
        icon: '/two-swords.webp',
      },
      defenses: {
        title: 'Мои тайники',
        icon: '/shield_small.webp',
      },
    },

    tabs: {
      all: 'Все',
      attacks: 'Мои поиски',
      defenses: 'Мои тайники',
    },

    emptyTitle: 'Нет игр',
    emptyHint: 'Спрячьте предметы или начните поиск',
    retry: 'Повторить',
    loadError: 'Не удалось загрузить игры',
  },

  history: {
    title: 'История игр',
    emptyTitle: 'История пуста',
    emptyHint: 'Завершенные игры появятся здесь',
    loading: 'Загрузка...',
  },

  createDefense: {
    title: 'Спрятать',
    difficulty: 'Сложность',
    attempts: 'Попытки',
    radars: 'Радары',
    scanners: 'Сканеры',
    bet: 'Ставка',
    betPlaceholder: 'Введите ставку',

    placeBombs: 'Спрячьте предметы',

    createRandom: 'Спрятать случайно',
    create: 'Создать тайник',

    insufficientFunds: 'Недостаточно средств',
    created: 'Тайник создан!',
    createError: 'Ошибка создания тайника',

    placeBombsError: (count: number) => `Разместите ${count} ${count === 1 ? 'предмет' : 'предмета'}`,

    betRangeError: (min: number, max: number) => `Ставка должна быть от ${min} до ${max}`,
  },

  searchAttack: {
    title: 'Автопоиск',
    subtitle: 'Автоматический подбор тайника',

    betRange: 'Диапазон ставки',
    from: 'От',
    to: 'До',

    search: 'Начать поиск',
    searching: 'Ищем...',
    cancelHint: 'Нажмите для отмены',

    found: 'Тайник найден!',

    infoMatch: 'Когда найдется подходящий тайник, вы автоматически начнете поиск',

    infoCharge: 'Звезды спишутся автоматически при нахождении тайника',

    confirmTitle: 'Подтверждение поиска',

    confirmText: 'Когда найдется подходящий тайник, звезды спишутся автоматически.',

    confirmRange: 'Диапазон ставки:',

    confirm: 'Да, начать поиск',
    cancel: 'Отмена',

    authRequired: 'Необходимо авторизоваться',
    started: 'Поиск начат',
    cancelled: 'Поиск отменен',
    error: 'Ошибка поиска',
  },

  result: {
    win: {
      emoji: '🤑',
      title: 'Вы победили',
      subtitle: 'Всё найдено!',
    },

    lose: {
      emoji: '😔',
      title: 'В этот раз не повезло',
      subtitle: 'Попробуйте еще раз',
    },

    half: {
      emoji: '🙂',
      title: 'Вы нашли часть',
      subtitle: 'И забрали половину ставки',
    },

    collect: 'Забрать',
  },

  gameLobby: {
    attackStarted: 'Поиск начался!',
    attackError: 'Ошибка начала поиска',
    moveError: 'Ошибка хода',
    scannerError: 'Ошибка сканера',
    selectClosedCell: 'Выберите закрытую клетку',
    radarError: 'Ошибка радара',
    genericError: 'Ошибка',

    foundBombs: (found: number, total: number) => `Найдено ${found}/${total}`,
    findBombs: (count: number) => `Найти ${count}`,
    findBombsCallToAction: (count: number) => `Найди ${count}`,

    attack: 'Искать',
    attempts: 'Попытки',
    radars: 'Радары',
    scanners: 'Сканеры',
    radar: 'Радар',
    attempt: 'Попытка',
    scanner: 'Сканер',
    collectHalf: 'Забрать',
  },

  board: {
    radarToColumn: 'Переключить радар на столбец',
    radarToRow: 'Переключить радар на строку',
  },

  time: {
    today: 'Сегодня',
    yesterday: 'Вчера',

    secondsAgo: (value: number) => `${value}с назад`,
    minutesAgo: (value: number) => `${value}м назад`,
    hoursAgo: (value: number) => `${value}ч назад`,
  },

  devLogin: {
    titleHint: 'Введите код для входа в тестовый аккаунт',
    availableCodes: 'Доступные коды: 1001, 1002, 1003, 1004',
    submit: 'Войти',
    invalidCode: 'Введите 4-значный код',
    success: 'Успешный вход!',
    error: 'Ошибка входа',
  },

  accessibility: {
    bomb: 'Спрятанный предмет',

    avatar: (name?: string | null) => (name ? `Аватар ${name}` : 'Аватар игрока'),
  },
} as const;

export type UiConfig = typeof uiConfig;
