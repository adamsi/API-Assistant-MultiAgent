package iaf.ofek.gisma.ai.util;

import lombok.extern.log4j.Log4j2;

import java.time.Duration;
import java.util.function.Predicate;
import java.util.function.Supplier;

@Log4j2
public class RetryUtils {

    public static <T> T callWithRetries(
            Supplier<T> operation,
            int maxAttempts,
            Duration delay,
            Predicate<Throwable> retryCondition,
            String operationName
    ) {
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return operation.get();
            } catch (Throwable ex) {
                boolean shouldRetry = attempt < maxAttempts && retryCondition.test(ex);

                if (!shouldRetry) {
                    logFailedMaxAttempts(operationName, attempt, ex.getMessage());
                    throw new RuntimeException(ex);
                }

                logRetry(operationName, attempt, maxAttempts, ex.getMessage());

                try {
                    Thread.sleep(delay.toMillis());
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Interrupted during retry", ie);
                }
            }
        }

        throw new RuntimeException("Unexpected retry loop exit");
    }

    private static void logRetry(String operationName, int attempt, int maxAttempts, String exceptionMessage) {
        log.warn("⚠️ [{}] Retry {}/{} due to: {}", operationName, attempt, maxAttempts, exceptionMessage);
    }

    private static void logFailedMaxAttempts(String operationName, int attempt, String exceptionMessage) {
        log.error("❌ [{}] Failed after {} attempts: {}", operationName, attempt, exceptionMessage);
    }

}
