class FormsValidation {
  //Тут расположим все селекторы, с которыми будем работать
  selectors = {
    form: "[data-js-form]",
    fieldErrors: "[data-js-form-field-errors]",
  };

  //Объект с типами ошибок и кастомными сообщениями к ним
  //Имена свойств выбираем исходя из имен полей свойства validity
  errorMessages = {
    //Пустое значение
    valueMissing: () => "Пожалуйста, заполните это поле",
    //Не соответствие регулярному выражению:
    //Деструктурируем свойство title из DOM-элемента (оно в разметке
    //содержит описание, как надо заполнять поле); если title не указан,
    //то возвращаем стандартное сообщение
    patternMismatch: ({ title }) => title || "Данные не соответствуют формату",
    //Слишком коротое значение:
    //Деструктурируем свойство min-length из DOM-элемента с разметки
    tooShort: ({ minLength }) =>
      `Слишком короткое значение, минимум символов: ${minLength}`,
    //Слишком длинное значение
    //Деструктурируем свойство max-length из DOM-элемента с разметки
    tooLong: () =>
      `Слишком длинное значение, ограничение символов: ${maxLength}`,
  };

  constructor() {
    this.bindEvents();
  }

  //Метод для управления визуальным выводом ошибок:
  //Ему передаем DOM-элемент и массив строк с сообщениями об ошибках
  manageErrors(fieldControlElement, errorMessages) {
    //Ищем нужный span для вывода ошибок:
    const fieldErrorsElement = fieldControlElement.parentElement.querySelector(
      this.selectors.fieldErrors
    );

    //Передаем ошибки в элемент:
    fieldErrorsElement.innerHTML = errorMessages
      .map((message) => `<span class="field__error>${message}</span>`)
      .join("");
  }

  //Метод для валидации переданного ему элемента:
  validateField(fieldControlElement) {
    //validity - это свойство, которое есть у каждого DOM-элемента формы
    const errors = fieldControlElement.validity;
    //Локальная переменная, в которую будем помещать строки с
    //сообщениями об ошибках:
    const errorMessages = [];

    //Преобразуем объект в массив пар "ключ-значение", а затем
    //итерируемся по нему:
    //[errorType, getErrorMessage] - деструктурируем из каждой пары
    //тип ошибки и сообщение к ней.
    Object.entries(this.errorMessages).forEach(
      ([errorType, getErrorMessage]) => {
        //Проверяем, если в errors свойства по определенному имени ошибки
        //имеют true, то добавляем в массив errorMessages сообщение об
        //этой ошибке:
        if (errors[errorType]) {
          errorMessages.push(getErrorMessage(fieldControlElement));
        }
      }
    );

    //Выводим визуально ошибки:
    this.manageErrors(fieldControlElement, errorMessages);

    //Переменная, отражающая, что поле валидное
    const isValid = errorMessages.length === 0;

    //Для повышения accessibility при ошибка устанавилваем aria-атрибут:
    //Если в errorMessages есть ошибки, то атрибут ставим в true
    fieldControlElement.ariaInvalid = !isValid;

    //Возвращаем значение проверки на валидность, чтобы использовать
    //его в методе onSubmit:
    return isValid;
  }

  //Функция (метод) для обработчика события blur:
  onBlur(event) {
    const { target } = event; //Из event получаем event.target и
    //присваиваем его переменной target (т.е. target = event.target);

    //Проверяем, что событие возникло на элементе внутри нашей формы,
    //которая имеет атрибут data-js-form:
    const isFormField = target.closest(this.selectors.form);
    //Переменная, содержащая свойства required DOM-элемента:
    //Если поле не обязательно к заполнению, то его не будем валидировать
    const isRequired = target.required;

    if (isFormField && isRequired) {
      this.validateField(target);
    }
  }

  //Функция (метод) для обработчика события blur:
  onChange(event) {
    const { target } = event; //Из event получаем event.target и
    //присваиваем его переменной target (т.е. target = event.target);

    //Проверяем, что поле необходимо для заполнения:
    const isRequired = target.required;
    //Проверяем, что элемент является радиокнопкой или чекбоксом:
    const isToggleType = ["radio", "checkbox"].includes(target.type);

    if (isToggleType && isRequired) {
      this.validateField(target);
    }
  }

  //Функция (метод) для обработчика события submit:
  onSubmit(event) {
    //Проверяем, что DOM-элемент event.target имеет нужный атрибут:
    const isFormElement = event.target.matches(this.selectors.form);

    //Если это другой элемент, то к нему не применяем кастомную валидацию
    if (!isFormElement) {
      return;
    }

    //Находим все required-поля формы:
    //Превращаем HTML-коллекцию элементов в массив и оставляем только те,
    //которые имеют свойство required=true.
    const requiredControlElements = [...event.target.elements].filter(
      ({ required }) => required
    );

    //По умолчанию признаем форму валидной:
    let isFormValid = true;

    //Первое не валидное поле в форме:
    let firstInvalidFieldControl = null;

    //Проверяем все required-поля по очереди:
    requiredControlElements.forEach((element) => {
      //Переменная, отражающая, прошло ли поле проверку на валидность
      const isFieldValid = this.validateField(element);

      //Если поле не валидно, то и вся форма не валидна:
      if (!isFieldValid) {
        isFormValid = false;

        //Если у нас этот элемент первый не валидный, то
        // его записываем в переменную:
        if (!firstInvalidFieldControl) {
          firstInvalidFieldControl = element;
        }
      }
    });

    //Если форма не валидна, то запрещаем её отправку:
    if (!isFormValid) {
      event.preventDefault();
      //Также берем в фокус первый не валидный элемент формы:
      firstInvalidFieldControl.focus();
    }
  }

  //В теле метода привязываем слушатели событий blur, change
  //и submit:
  bindEvents() {
    //Валидируем поле при потере с него фокуса через blur:
    //т.к. blur не всплывает, то добавляем capture:true, чтобы
    //ловить событие на погружении.
    //При возникновении события blur вызывается метод onBlur
    document.addEventListener(
      "blur",
      (event) => {
        this.onBlur(event);
      },
      { capture: true }
    );

    //Валидируем поле при потере фокуса через change:
    document.addEventListener("change", (event) => this.onChange(event));

    //Вызываем собственную валидацию при попытке отправки формы:
    document.addEventListener("submit", (event) => this.onSubmit(event));
  }
}

//Вызываем класс, чтобы функционал сразу запускался:
new FormsValidation();
