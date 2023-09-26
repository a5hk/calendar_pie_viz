# Calendar Pie Chart

A calendar with pie charts showing the distribution of different categories for each day.

## Examples

```
| gentimes start=12/15/22 end=1/15/23 increment=1m
| eval _time=starttime
| eval day=strftime(_time, "%a")
| eval status=(random() % 5) + 1
| eval status=case(status == 1, 200, status == 2, 200, status == 3, 300, status == 4, 400, status = 5, 500)
| eval status=if(status==500 OR status==400, (random() % 5) + 1, status)
| eval status=case(status == 1, 200, status == 2, 200, status == 3, 300, status == 4, 400, status = 5, 500, 1==1, status)
| eval status=if(status==500 AND day!="Tue", (random() % 5) + 1, status)
| eval status=case(status == 1, 200, status == 2, 200, status == 3, 300, status == 4, 400, status = 5, 500, 1==1, status)
| timechart cont=f span=1d count by status
```

![screenshot](/static/screenshot.png)

## License

[MIT License](LICENSE)
