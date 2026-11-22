# Consulta por voz con agentes representantes

## Qué es

Una consulta por voz para grupos que discrepan. Cada persona recibe un enlace personal y anónimo y responde la pregunta en hasta 2 minutos de audio. El sistema transcribe, borra el audio y saca de cada respuesta la postura, las razones y las afirmaciones de hecho, cada una con su cita textual.

Cada participante queda con un agente que lo representa. Esos agentes votan muchos borradores de postura común, y un mediador elige la que aceptan personas de grupos que normalmente no están de acuerdo (factorización tipo Community Notes y método de Schulze). Cuando el agente no está seguro de lo que su dueño aceptaría, no adivina: le hace una sola pregunta. Si la persona corrige a su agente, se recalculan todos los votos que salieron de esa frase y la postura común se actualiza.

Al final cada persona recibe un informe general y una devolución personal: dónde queda frente al resto y qué fuentes respaldan o contradicen lo que dijo.

Pasa la prueba del track porque con una sola persona no hay mapa ni postura común. Frente a Habermolt (arXiv 2605.24413), su antecedente directo, la diferencia es que el agente se abstiene cuando no sabe y repara lo que ya hizo cuando lo corriges.

## Mejoras que no descuadran el foco

1. La sala responde durante el hack. En el escenario solo va en vivo la pregunta de 10 segundos y la corrección.
2. Medir cuánto acierta el agente frente a la respuesta real de su dueño y mostrar el porcentaje.
3. Mostrar la cascada de una corrección: votos recalculados y cambio en el apoyo del puente.
4. Exigir que el puente contenga algo que al menos un grupo rechazaba al inicio, para que no sea una obviedad.
5. Elegir una pregunta que divida a la sala, probada antes con respuestas sintéticas.
6. Índice de estabilidad: correr el mediador 5 veces con orden distinto y mostrar si sale la misma postura.
7. Infraestructura que aguante: grabar en el teléfono y subir a una cola, mapa cada 3 a 5 segundos, Supabase Pro o Ably, 60 respuestas de respaldo rotuladas y botón para congelar el último estado bueno.
8. Un grupo real con una decisión concreta y alguien que se comprometa a responder qué adopta.

Fuera para no dispersarse: lista proporcional, tope de influencia por agente, verificación de hechos en vivo, corte detallado por edad, señales de la voz y entrevistador de voz para toda la sala.

## Documentos

- `plan-consulta-voz.md`: el ciclo de una ronda y las fases.
- `stack-tecnico-consulta-voz.md`: modelos, matemática y plan anticaídas.
- `borde-ia-consulta-voz.md`: técnicas de borde con su evidencia.
- `informe-100.md`: qué falta para 5/5 en cada criterio, con fuentes.
