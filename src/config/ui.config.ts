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
    police: '/police.png',
    policeMask: '/police-mask.png',
    policeInCar: '/police-in-car.png',
    robber: '/robber.png',
    robberMask: '/robber-mask.png',
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
    waiting: 'Соперник',
    bet: 'Ставка',
    winnings: 'Выигрыш',
    loss: 'Проигрыш',
    victory: 'Победа',
    defeat: 'Поражение',
    refund: 'Возврат',
    completed: 'Завершена',
    expired: 'Истекла',
    waitingForAttack: 'Поиск соперника',
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
      description: '3×3, 2 ценности',
    },
    MEDIUM: {
      label: 'Средний',
      description: '4×4, 1 ценность',
    },
    HARD: {
      label: 'Сложный',
      description: '5×5, 3 ценности',
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
      games: 'Лобби',
      leaders: 'Лидеры',
    },

    actions: {
      attack: 'Искать',
      autoMatch: 'Автопоиск',
      createDefense: 'Спрятать',
    },
  },

  defenseAttackAlert: {
    title: 'Соперник найден!',
    message: (name: string) => `${name} атакует вашу защиту`,
    hint: 'Нажмите, чтобы открыть игру',
    openGame: 'Открыть атакованную защиту',
  },

  home: {
    attackTitle: 'Искать',
    attackDescription: 'Найди спрятанные ценности',

    autoMatchTitle: 'Автопоиск',
    autoMatchDescription: 'Автоматический подбор игры',

    defenseTitle: 'Спрятать',
    defenseDescription: 'Спрячь ценности и поставь ставку',

    howToPlay: 'Как играть?',

    steps: ['Поставь ставку и спрячь ценности на поле', 'Или найди ценности, спрятанные другим игроком', 'Используй сканер и радар для поиска', 'Найди все ценности — выиграй ставку!'],
  },

  games: {
    title: 'Лобби',

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

    emptyTitle: 'Нет доступных лобби',
    emptyHint: 'Создайте лобби первым',
    createDefense: 'Спрятать',
  },

  myGames: {
    pages: {
      all: {
        title: 'Мои игры',
        icon: '/controller.png',
      },
      attacks: {
        title: 'Я искал',
        icon: '/search-1.png',
      },
      defenses: {
        title: 'Я спрятал',
        icon: '/money.png',
      },
    },

    tabs: {
      all: 'Все',
      attacks: 'Я искал',
      defenses: 'Я спрятал',
    },

    emptyTitle: 'Нет игр',
    emptyHint: 'Спрячьте ценности или начните поиск',
    retry: 'Повторить',
    loadError: 'Не удалось загрузить игры',
  },

  history: {
    title: 'История игр',
    backToGames: 'Вернуться к списку игр',
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

    placeBombs: 'Спрячьте ценности',

    createRandom: 'Спрятать случайно',
    create: 'Спрятать ценности',

    insufficientFunds: 'Недостаточно средств',
    created: 'Ценности спрятаны!',
    createError: 'Ошибка',

    placeBombsError: (count: number) => `Разместите ${count} ${count === 1 ? 'ценность' : count >= 2 && count <= 4 ? 'ценности' : 'ценностей'}`,

    betRangeError: (min: number, max: number) => `Ставка должна быть от ${min} до ${max}`,
  },

  searchAttack: {
    title: 'Автопоиск',
    subtitle: 'Автоматический подбор игры',

    betRange: 'Диапазон ставки',
    from: 'От',
    to: 'До',

    search: 'Начать поиск',
    searching: 'Ищем...',
    cancelHint: 'Нажмите для отмены',

    found: 'Игра найдена!',

    infoMatch: 'Когда найдется подходящая игра, вы автоматически начнете поиск',

    infoCharge: 'Звезды спишутся автоматически после подбора игры',

    confirmTitle: 'Подтверждение поиска',

    confirmText: 'Когда найдется подходящая игра, звезды спишутся автоматически.',

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
      subtitle: 'Все ценности найдены!',
    },

    lose: {
      emoji: '😔',
      title: 'В этот раз не повезло',
      subtitle: 'Попробуйте еще раз',
    },

    half: {
      emoji: '🙂',
      title: 'Вы нашли часть ценностей',
      subtitle: 'И забрали половину ставки',
    },

    collect: 'Забрать',
  },

  gameLobby: {
    attackStarted: 'Поиск начался!',
    attackError: 'Ошибка начала поиска',
    waitingHint: 'Это займёт некоторое время.\nМожно закрыть окно — о найденном сопернике придёт уведомление в Telegram.',
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
    bomb: 'Ценность',

    avatar: (name?: string | null) => (name ? `Аватар ${name}` : 'Аватар игрока'),
  },
} as const;

export type UiConfig = typeof uiConfig;
