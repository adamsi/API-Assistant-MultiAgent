package iaf.ofek.gisma.ai.util;

import lombok.extern.log4j.Log4j2;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.concurrent.Callable;

@Log4j2
public class ReactiveUtils {

    public static <T> Mono<T> runBlockingCallableAsync(Callable<T> callable) {
        return Mono.fromCallable(callable)
                .subscribeOn(Schedulers.boundedElastic()) // moves blocking call off main thread
                .onErrorResume(ex -> {
                    log.error("Error during async blocking execution: {}.", ex.getMessage());
                    return Mono.empty();
                });
    }

}
