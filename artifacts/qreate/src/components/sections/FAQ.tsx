import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    id: "what-is-qr",
    question: "Что такое QR-код?",
    answer: "QR-код (Quick Response code) — это двумерный штрихкод, который содержит информацию, закодированную в виде комбинации чёрных и белых квадратов. Он может содержать текст, ссылки, контакты и другую информацию, которую можно быстро отсканировать с помощью смартфона.",
  },
  {
    id: "how-to-scan",
    question: "Как сканировать QR-код?",
    answer: "Откройте встроенную камеру на вашем смартфоне и наведите её на QR-код. Автоматически появится уведомление со ссылкой или информацией. Альтернативно, используйте приложение для сканирования QR-кодов из App Store или Google Play.",
  },
  {
    id: "how-to-create",
    question: "Как создать QR-код в Qreate?",
    answer: "Выберите тип контента (ссылка, текст, контакт и т.д.), заполните необходимые поля, настройте дизайн с помощью цветов и стилей, а затем скачайте QR-код в формате PNG или SVG.",
  },
  {
    id: "formats",
    question: "Какие форматы поддерживает Qreate?",
    answer: "Мы поддерживаем следующие форматы контента: URL, текст, email, телефон, Wi-Fi, SMS, vCard (контакты), геолокацию, события календаря, WhatsApp и Telegram.",
  },
  {
    id: "export-formats",
    question: "В каких форматах можно экспортировать QR-код?",
    answer: "QR-коды можно скачать в двух форматах: PNG (растровый) и SVG (векторный). PNG лучше подходит для веб-сайтов, а SVG идеален для печати и масштабирования без потери качества.",
  },
  {
    id: "dynamic-qr",
    question: "Что такое динамические QR-коды?",
    answer: "Динамические QR-коды позволяют изменять содержимое после создания. Это полезно для маркетинговых кампаний, когда нужна возможность обновить ссылку без изменения самого кода.",
  },
  {
    id: "history",
    question: "Как найти созданные QR-коды?",
    answer: "Все созданные QR-коды автоматически сохраняются в разделе «История» и доступны для редактирования и скачивания в любой момент.",
  },
  {
    id: "storage",
    question: "Где хранятся мои QR-коды?",
    answer: "Все QR-коды хранятся локально в памяти вашего браузера. Это означает, что они приватны и доступны только на вашем устройстве.",
  },
  {
    id: "free",
    question: "Qreate — это бесплатно?",
    answer: "Да, основные функции Qreate полностью бесплатны. Мы предоставляем неограниченное создание и скачивание QR-кодов без каких-либо ограничений.",
  },
  {
    id: "logo",
    question: "Как добавить логотип в QR-код?",
    answer: "На вкладке «Дизайн» используйте функцию загрузки логотипа. Вы можете загрузить изображение со своего устройства или использовать URL. Размер логотипа можно регулировать слайдером.",
  },
];

export function FAQ() {
  return (
    <section className="my-24 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Часто задаваемые вопросы
          </h2>
          <p className="text-muted-foreground text-lg">
            Найдите ответы на популярные вопросы о Qreate и QR-кодах
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 sm:p-8">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="border-b border-border/40 last:border-b-0"
              >
                <AccordionTrigger className="hover:text-primary transition-colors py-4">
                  <span className="text-left text-base md:text-lg font-semibold">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Не нашли ответ на свой вопрос?
          </p>
          <a
            href="mailto:support@qreate.app"
            className="text-primary hover:underline font-medium"
          >
            Свяжитесь с нами
          </a>
        </div>
      </div>
    </section>
  );
}
